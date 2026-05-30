"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  characters,
  characterSkills,
  characterRunes,
  conditions,
  competencesAlea,
  items,
  statusNotes,
  trainingRequests,
  publicRolls,
} from "@/db/schema";
import { ALL_SKILLS } from "@/lib/skills";
import { assertMJ, assertMJOnly } from "./guards";

type ActionResult<T> = ({ ok: true } & T) | { ok: false; reason: string };

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
    if (v && !/^(https?:\/\/|data:image\/)/i.test(v)) {
      return { ok: false, reason: "Portrait : URL http(s) ou image téléversée" };
    }
    u.avatarUrl = v ? v.slice(0, 3_000_000) : null;
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

/**
 * createCharacter — création MJ d'un personnage joueur (bouton « + Ajouter »
 * du roster). Réservé MJ. `ownerUserId` reste NULL (aucun lien user) : le perso
 * existe mais n'apparaît pas dans /me tant que le MJ ne l'a pas relié.
 *
 * Défauts sains (cf. spec #84) : skills à 1 pt pour les 20 compétences, runes
 * = 3 slots vides, vitaux pleins, 2 points de destin. Validation du nom :
 * requis, max 60 chars, pas de doublon (même prénom déjà en BDD).
 */
export async function createCharacter(
  name: string,
): Promise<ActionResult<{ id: string }>> {
  await assertMJ();

  const clean = (name ?? "").trim();
  if (!clean) return { ok: false, reason: "Prénom requis" };
  if (clean.length > 60) return { ok: false, reason: "Prénom trop long (60 max)" };

  // Pas de doublon de prénom (le name pilote les !commands du bot).
  const existing = await db.query.characters.findFirst({
    where: eq(characters.name, clean),
    columns: { id: true },
  });
  if (existing) {
    return { ok: false, reason: `Un personnage « ${clean} » existe déjà` };
  }

  const [created] = await db
    .insert(characters)
    .values({
      name: clean,
      // ownerUserId laissé NULL : aucun lien user (MJ seul voit/édite).
      // Défauts explicites alignés sur le schema (sécurité si schema évolue).
      nom: "",
      age: 25,
      xp: 0,
      enduranceTrainings: 2,
      fluxTrainings: 0,
      technicalTrainings: 0,
      combatsReal: 0,
      fatePoints: 2,
      currentHp: 45,
      currentMental: 45,
      currentEndurance: 250,
      currentFlux: 100,
      runes: ["", "", ""],
      isPresent: 0,
    })
    .returning({ id: characters.id });

  // Initialise les 20 compétences à 1 pt (bulk insert, pas de transaction
  // requise — un seul INSERT multi-lignes côté Neon HTTP).
  await db.insert(characterSkills).values(
    ALL_SKILLS.map((skillName) => ({
      characterId: created.id,
      skillName,
      points: 1,
    })),
  );

  revalidatePath("/mj");
  revalidatePath("/plateau");
  return { ok: true, id: created.id };
}

/**
 * deleteCharacter — suppression MJ d'un personnage (icône poubelle du roster).
 * Réservé MJ.
 *
 * FK en cascade (schema) : character_skill, character_rune, condition,
 * competences_alea, item, status_note, training_request sont supprimés
 * automatiquement par Postgres (onDelete: cascade). public_roll.characterId
 * passe à NULL (SET NULL) — les jets restent, characterName conservé.
 * Les journal_entry sont liées à campaignId (pas au perso) : non supprimées.
 *
 * On compte les dépendances AVANT suppression pour les afficher dans la modale
 * de confirmation et le toast. (Neon HTTP ne supporte pas les transactions
 * multi-statements ; les COUNT puis le DELETE sont séquentiels.)
 */
export async function deleteCharacter(characterId: string): Promise<
  ActionResult<{
    name: string;
    deletedSkills: number;
    deletedRunes: number;
    deletedConditions: number;
    deletedCompetencesAlea: number;
    deletedItems: number;
    deletedStatusNotes: number;
    deletedTrainingRequests: number;
    orphanedPublicRolls: number;
  }>
> {
  const { character } = await assertMJOnly(characterId);

  // Comptages des dépendances (un SELECT count(*) par table enfant).
  const [
    skillsCount,
    runesCount,
    conditionsCount,
    competencesCount,
    itemsCount,
    notesCount,
    trainingCount,
    rollsCount,
  ] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(characterSkills)
      .where(eq(characterSkills.characterId, characterId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(characterRunes)
      .where(eq(characterRunes.characterId, characterId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(conditions)
      .where(eq(conditions.characterId, characterId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(competencesAlea)
      .where(eq(competencesAlea.characterId, characterId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(items)
      .where(eq(items.characterId, characterId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(statusNotes)
      .where(eq(statusNotes.characterId, characterId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(trainingRequests)
      .where(eq(trainingRequests.characterId, characterId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(publicRolls)
      .where(eq(publicRolls.characterId, characterId)),
  ]);

  // Suppression du perso — les enfants partent par cascade FK ; public_roll
  // passe à NULL automatiquement (SET NULL). Les journal_entry (liées à la
  // campagne, pas au perso) ne sont pas affectées.
  await db.delete(characters).where(eq(characters.id, characterId));

  revalidatePath("/mj");
  revalidatePath("/plateau");
  revalidatePath("/me");

  return {
    ok: true,
    name: character.name,
    deletedSkills: skillsCount[0]?.n ?? 0,
    deletedRunes: runesCount[0]?.n ?? 0,
    deletedConditions: conditionsCount[0]?.n ?? 0,
    deletedCompetencesAlea: competencesCount[0]?.n ?? 0,
    deletedItems: itemsCount[0]?.n ?? 0,
    deletedStatusNotes: notesCount[0]?.n ?? 0,
    deletedTrainingRequests: trainingCount[0]?.n ?? 0,
    orphanedPublicRolls: rollsCount[0]?.n ?? 0,
  };
}
