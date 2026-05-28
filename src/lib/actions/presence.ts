"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { assertCanEdit } from "./guards";

/**
 * Toggle la présence d'un personnage sur le plateau de jeu.
 * Owner ou MJ. Quand isPresent=0, le perso est masqué du roster /plateau.
 */
export async function togglePresence(
  characterId: string,
): Promise<{ ok: true; isPresent: boolean } | { ok: false; reason: string }> {
  const { character } = await assertCanEdit(characterId);

  const next = character.isPresent ? 0 : 1;
  await db
    .update(characters)
    .set({ isPresent: next, updatedAt: new Date() })
    .where(eq(characters.id, character.id));

  revalidatePath("/me");
  revalidatePath("/mj");
  revalidatePath("/plateau");

  return { ok: true, isPresent: next === 1 };
}
