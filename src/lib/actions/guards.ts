/**
 * Helpers d'autorisation pour les Server Actions FAITH : RE.
 *
 * - `assertCanEdit` : MJ OU propriétaire du perso. Utilisé pour mutations classiques
 *   (skills, vitals, actions endurance, fate points, etc.).
 * - `assertMJOnly` : réservé MJ. Utilisé pour mutations narratives globales
 *   (XP, trainings d'endurance, runes).
 *
 * Les deux helpers chargent le perso en BDD et renvoient `{ session, character }`
 * pour éviter un second roundtrip côté caller.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function assertCanEdit(characterId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const character = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  });
  if (!character) throw new Error("NOT_FOUND");
  if (
    session.user.role !== "mj" &&
    character.ownerUserId !== session.user.id
  ) {
    throw new Error("FORBIDDEN");
  }
  return { session, character };
}

/** Garde MJ sans personnage cible (campagne, journal, PNJ…). */
export async function assertMJ() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "mj") throw new Error("FORBIDDEN_MJ_ONLY");
  return { session };
}

export async function assertMJOnly(characterId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "mj") {
    throw new Error("FORBIDDEN_MJ_ONLY");
  }
  const character = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  });
  if (!character) throw new Error("NOT_FOUND");
  return { session, character };
}
