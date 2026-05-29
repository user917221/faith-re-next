"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characterRunes } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { RUNE_TYPES, type RuneType } from "@/lib/faith-system";
import { assertCanEdit } from "./guards";

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
