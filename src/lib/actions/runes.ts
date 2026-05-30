"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characterRunes, type RuneRarity } from "@/db/schema";
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

/** Met à jour niveau / rareté / dégâts d'une rune (owner ou MJ). */
export async function updateRune(
  characterId: string,
  runeId: string,
  patch: { level?: number; rarity?: RuneRarity; damage?: string },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  await assertCanEdit(characterId);

  const set: Partial<{ level: number; rarity: RuneRarity; damage: string | null }> = {};
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
  if (Object.keys(set).length === 0) return { ok: true };

  await db.update(characterRunes).set(set).where(eq(characterRunes.id, runeId));
  revalidateAll();
  return { ok: true };
}
