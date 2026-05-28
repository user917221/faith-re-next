"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { characters, trainingRequests, users } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getEnduranceTier } from "@/lib/faith-system";
import { assertCanEdit } from "./guards";

/** Le joueur (owner) ou le MJ ouvre une demande d'entraînement endurance. */
export async function requestTraining(
  characterId: string,
  note?: string,
): Promise<{ ok: true; requestId: string } | { ok: false; reason: string }> {
  const { character } = await assertCanEdit(characterId);

  // Éviter le spam : une seule pending par perso à la fois.
  const existing = await db
    .select({ id: trainingRequests.id })
    .from(trainingRequests)
    .where(
      and(
        eq(trainingRequests.characterId, character.id),
        eq(trainingRequests.status, "pending"),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    return { ok: false, reason: "Une demande est déjà en attente pour ce personnage." };
  }

  const session = await auth();
  const [created] = await db
    .insert(trainingRequests)
    .values({
      characterId: character.id,
      requestedBy: session?.user?.id ?? null,
      note: note?.trim() || null,
    })
    .returning({ id: trainingRequests.id });

  revalidatePath("/me");
  revalidatePath("/mj");

  return { ok: true, requestId: created.id };
}

async function assertMJ() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "mj") throw new Error("FORBIDDEN_MJ_ONLY");
  return session;
}

/** Le MJ approuve : déclenche +1 enduranceTrainings sur le perso. */
export async function approveTraining(requestId: string): Promise<
  | { ok: true; trainings: number; newMax: number; newLabel: string; tierChanged: boolean }
  | { ok: false; reason: string }
> {
  const session = await assertMJ();

  const req = await db.query.trainingRequests.findFirst({
    where: eq(trainingRequests.id, requestId),
  });
  if (!req) return { ok: false, reason: "Requête introuvable" };
  if (req.status !== "pending") return { ok: false, reason: "Requête déjà décidée" };

  const char = await db.query.characters.findFirst({ where: eq(characters.id, req.characterId) });
  if (!char) return { ok: false, reason: "Personnage introuvable" };

  const prevTier = getEnduranceTier(char.enduranceTrainings);
  const next = char.enduranceTrainings + 1;
  const nextTier = getEnduranceTier(next);

  await db.transaction(async (tx) => {
    await tx
      .update(characters)
      .set({ enduranceTrainings: next, updatedAt: new Date() })
      .where(eq(characters.id, char.id));
    await tx
      .update(trainingRequests)
      .set({ status: "approved", decidedBy: session.user.id, decidedAt: new Date() })
      .where(eq(trainingRequests.id, requestId));
  });

  revalidatePath("/me");
  revalidatePath("/mj");

  return {
    ok: true,
    trainings: next,
    newMax: nextTier.max,
    newLabel: nextTier.label,
    tierChanged: nextTier.label !== prevTier.label,
  };
}

/** Le MJ refuse : ne touche pas le perso, marque rejected. */
export async function rejectTraining(
  requestId: string,
  note?: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const session = await assertMJ();

  const req = await db.query.trainingRequests.findFirst({
    where: eq(trainingRequests.id, requestId),
  });
  if (!req) return { ok: false, reason: "Requête introuvable" };
  if (req.status !== "pending") return { ok: false, reason: "Requête déjà décidée" };

  await db
    .update(trainingRequests)
    .set({
      status: "rejected",
      decidedBy: session.user.id,
      decidedAt: new Date(),
      note: note?.trim() || req.note,
    })
    .where(eq(trainingRequests.id, requestId));

  revalidatePath("/me");
  revalidatePath("/mj");

  return { ok: true };
}

export type TrainingRequestWithChar = {
  id: string;
  characterId: string;
  characterName: string;
  requesterName: string | null;
  requestedAt: Date;
  status: "pending" | "approved" | "rejected";
  note: string | null;
};

/** Liste les requêtes (MJ : toutes pending ; joueur : seulement les siennes). */
export async function listTrainingRequestsForMJ(): Promise<TrainingRequestWithChar[]> {
  await assertMJ();
  const rows = await db
    .select({
      id: trainingRequests.id,
      characterId: trainingRequests.characterId,
      characterName: characters.name,
      requesterName: users.name,
      requestedAt: trainingRequests.requestedAt,
      status: trainingRequests.status,
      note: trainingRequests.note,
    })
    .from(trainingRequests)
    .innerJoin(characters, eq(characters.id, trainingRequests.characterId))
    .leftJoin(users, eq(users.id, trainingRequests.requestedBy))
    .where(eq(trainingRequests.status, "pending"))
    .orderBy(desc(trainingRequests.requestedAt));
  return rows;
}

/** Liste les requêtes du joueur courant (toutes : pending/approved/rejected). */
export async function listTrainingRequestsForCharacter(
  characterId: string,
): Promise<TrainingRequestWithChar[]> {
  await assertCanEdit(characterId);
  const rows = await db
    .select({
      id: trainingRequests.id,
      characterId: trainingRequests.characterId,
      characterName: characters.name,
      requesterName: users.name,
      requestedAt: trainingRequests.requestedAt,
      status: trainingRequests.status,
      note: trainingRequests.note,
    })
    .from(trainingRequests)
    .innerJoin(characters, eq(characters.id, trainingRequests.characterId))
    .leftJoin(users, eq(users.id, trainingRequests.requestedBy))
    .where(eq(trainingRequests.characterId, characterId))
    .orderBy(desc(trainingRequests.requestedAt))
    .limit(20);
  return rows;
}
