"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  characterRunes,
  characters,
  competencesAlea,
  type RuneRarity,
} from "@/db/schema";
import { revalidatePath } from "next/cache";
import { RUNE_TYPES, type RuneType } from "@/lib/faith-system";
import { assertCanEdit } from "./guards";

const RUNE_RARITIES: RuneRarity[] = ["commune", "rare", "epique", "legendaire"];

function revalidateAll() {
  revalidatePath("/me");
  revalidatePath("/mj");
}

/** Ajoute une rune à l'inventaire (owner ou MJ). */
export async function addRune(
  characterId: string,
  input: { name: string; type: RuneType; description?: string },
): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  await assertCanEdit(characterId);
  const name = input.name?.trim();
  if (!name) return { ok: false, reason: "Nom de rune requis" };
  if (!RUNE_TYPES.includes(input.type)) return { ok: false, reason: "Type de rune invalide" };

  const [created] = await db
    .insert(characterRunes)
    .values({
      characterId,
      name: name.slice(0, 80),
      type: input.type,
      description: input.description?.trim() || null,
    })
    .returning({ id: characterRunes.id });

  revalidateAll();
  return { ok: true, id: created.id };
}

/** Retire une rune de l'inventaire (owner ou MJ). */
export async function removeRune(
  characterId: string,
  runeId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  await assertCanEdit(characterId);
  await db.delete(characterRunes).where(eq(characterRunes.id, runeId));
  revalidateAll();
  return { ok: true };
}

/** Met à jour niveau / rareté / dégâts / armure / quantité d'une rune (owner ou MJ). */
export async function updateRune(
  characterId: string,
  runeId: string,
  patch: {
    level?: number;
    rarity?: RuneRarity;
    damage?: string;
    armor?: number;
    qty?: number;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  await assertCanEdit(characterId);

  const set: Partial<{
    level: number;
    rarity: RuneRarity;
    damage: string | null;
    armor: number;
    qty: number;
  }> = {};
  if (typeof patch.level === "number" && Number.isFinite(patch.level)) {
    set.level = Math.max(1, Math.min(99, Math.round(patch.level)));
  }
  if (patch.rarity && RUNE_RARITIES.includes(patch.rarity)) {
    set.rarity = patch.rarity;
  }
  if (typeof patch.damage === "string") {
    const v = patch.damage.trim();
    set.damage = v.length ? v.slice(0, 24) : null;
  }
  if (typeof patch.armor === "number" && Number.isFinite(patch.armor)) {
    set.armor = Math.max(0, Math.min(99, Math.round(patch.armor)));
  }
  if (typeof patch.qty === "number" && Number.isFinite(patch.qty)) {
    set.qty = Math.max(1, Math.min(999, Math.round(patch.qty)));
  }
  if (Object.keys(set).length === 0) return { ok: true };

  await db.update(characterRunes).set(set).where(eq(characterRunes.id, runeId));
  revalidateAll();
  return { ok: true };
}

// ---------------- Cristaux de Lumière ----------------

/** Met à jour le compteur de Cristaux de Lumière (owner ou MJ). 0-999. */
export async function updateLightCrystals(
  characterId: string,
  newCount: number,
): Promise<{ ok: true; value: number } | { ok: false; reason: string }> {
  await assertCanEdit(characterId);
  if (!Number.isFinite(newCount)) {
    return { ok: false, reason: "Valeur de cristaux invalide" };
  }
  const value = Math.max(0, Math.min(999, Math.round(newCount)));
  await db
    .update(characters)
    .set({ lightCrystals: value, updatedAt: new Date() })
    .where(eq(characters.id, characterId));
  revalidateAll();
  return { ok: true, value };
}

// ---------------- Compétences de l'Aléa ----------------

/** Ajoute une compétence de l'Aléa (owner ou MJ). */
export async function addCompetenceAlea(
  characterId: string,
  input: { name: string; description?: string },
): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  await assertCanEdit(characterId);
  const name = input.name?.trim();
  if (!name) return { ok: false, reason: "Nom de compétence requis" };

  const [created] = await db
    .insert(competencesAlea)
    .values({
      characterId,
      name: name.slice(0, 80),
      description: input.description?.trim() || null,
    })
    .returning({ id: competencesAlea.id });

  revalidateAll();
  return { ok: true, id: created.id };
}

/** Retire une compétence de l'Aléa (owner ou MJ). */
export async function removeCompetenceAlea(
  characterId: string,
  competenceId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  await assertCanEdit(characterId);
  await db.delete(competencesAlea).where(eq(competencesAlea.id, competenceId));
  revalidateAll();
  return { ok: true };
}
