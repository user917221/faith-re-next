"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { characters, characterSkills } from "@/db/schema";
import { ALL_SKILLS } from "@/lib/skills";
import { assertMJOnly } from "./guards";

/**
 * updateCharacterFull — édition MJ complète d'un personnage (panneau
 * « Modifications »). Réservé MJ. Tout est optionnel ; seuls les champs
 * présents sont mis à jour. Les `max*Override` à null = retour au max dérivé.
 */
export type FullCharacterPatch = Partial<{
  name: string;
  nom: string;
  age: number;
  race: string | null;
  pronouns: string | null;
  charClass: string | null;
  bio: string | null;
  notes: string | null;
  avatarUrl: string | null;
  xp: number;
  enduranceTrainings: number;
  fluxTrainings: number;
  technicalTrainings: number;
  combatsReal: number;
  fatePoints: number;
  currentHp: number;
  currentMental: number;
  currentEndurance: number;
  currentFlux: number;
  maxHpOverride: number | null;
  maxMentalOverride: number | null;
  maxEnduranceOverride: number | null;
  maxFluxOverride: number | null;
  isPresent: boolean;
  skills: Record<string, number>;
}>;

const clampInt = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(Number(v) || 0)));

const tag = (v: string | null): string | null => {
  if (v === null) return null;
  const t = v.trim();
  return t.length ? t.slice(0, 1000) : null;
};

const overrideOrNull = (v: number | null): number | null =>
  v === null || !Number.isFinite(v) || v <= 0 ? null : clampInt(v, 1, 100000);

export async function updateCharacterFull(
  characterId: string,
  patch: FullCharacterPatch,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  await assertMJOnly(characterId);

  const u: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof patch.name === "string") {
    const v = patch.name.trim();
    if (!v) return { ok: false, reason: "Prénom requis" };
    u.name = v.slice(0, 60);
  }
  if (typeof patch.nom === "string") u.nom = patch.nom.trim().slice(0, 80);
  if (typeof patch.age === "number") u.age = clampInt(patch.age, 1, 999);
  if (patch.race !== undefined) u.race = tag(patch.race ?? "");
  if (patch.pronouns !== undefined) u.pronouns = tag(patch.pronouns ?? "");
  if (patch.charClass !== undefined) u.charClass = tag(patch.charClass ?? "");
  if (patch.bio !== undefined) u.bio = tag(patch.bio ?? "");
  if (patch.notes !== undefined) u.notes = tag(patch.notes ?? "");
  if (patch.avatarUrl !== undefined) {
    const v = (patch.avatarUrl ?? "").trim();
    if (v && !/^https?:\/\//i.test(v)) {
      return { ok: false, reason: "URL de portrait invalide" };
    }
    u.avatarUrl = v ? v.slice(0, 500) : null;
  }

  if (typeof patch.xp === "number") u.xp = clampInt(patch.xp, 0, 1000000);
  if (typeof patch.enduranceTrainings === "number")
    u.enduranceTrainings = clampInt(patch.enduranceTrainings, 0, 99);
  if (typeof patch.fluxTrainings === "number")
    u.fluxTrainings = clampInt(patch.fluxTrainings, 0, 99);
  if (typeof patch.technicalTrainings === "number")
    u.technicalTrainings = clampInt(patch.technicalTrainings, 0, 99);
  if (typeof patch.combatsReal === "number")
    u.combatsReal = clampInt(patch.combatsReal, 0, 999);
  if (typeof patch.fatePoints === "number")
    u.fatePoints = clampInt(patch.fatePoints, 0, 99);

  if (typeof patch.currentHp === "number")
    u.currentHp = clampInt(patch.currentHp, 0, 100000);
  if (typeof patch.currentMental === "number")
    u.currentMental = clampInt(patch.currentMental, 0, 100000);
  if (typeof patch.currentEndurance === "number")
    u.currentEndurance = clampInt(patch.currentEndurance, 0, 100000);
  if (typeof patch.currentFlux === "number")
    u.currentFlux = clampInt(patch.currentFlux, 0, 100000);

  if (patch.maxHpOverride !== undefined)
    u.maxHpOverride = overrideOrNull(patch.maxHpOverride);
  if (patch.maxMentalOverride !== undefined)
    u.maxMentalOverride = overrideOrNull(patch.maxMentalOverride);
  if (patch.maxEnduranceOverride !== undefined)
    u.maxEnduranceOverride = overrideOrNull(patch.maxEnduranceOverride);
  if (patch.maxFluxOverride !== undefined)
    u.maxFluxOverride = overrideOrNull(patch.maxFluxOverride);

  if (typeof patch.isPresent === "boolean")
    u.isPresent = patch.isPresent ? 1 : 0;

  await db.update(characters).set(u).where(eq(characters.id, characterId));

  // Compétences (optionnel) — upsert des skills connus.
  if (patch.skills) {
    for (const [skillName, raw] of Object.entries(patch.skills)) {
      if (!(ALL_SKILLS as readonly string[]).includes(skillName)) continue;
      const points = clampInt(raw, 0, 99);
      await db
        .insert(characterSkills)
        .values({ characterId, skillName, points })
        .onConflictDoUpdate({
          target: [characterSkills.characterId, characterSkills.skillName],
          set: { points },
        });
    }
  }

  revalidatePath("/mj");
  revalidatePath("/me");
  return { ok: true };
}
