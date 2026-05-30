/**
 * Server Actions — campagne, séances (minuteur) et notes de statut (Phase 5).
 *
 * - `updateCampaignStatus` / `setActiveCampaign` / `createCampaign` (MJ).
 * - `startSessionTimer` / `pauseSessionTimer` / `advanceSession` (MJ).
 * - `addStatusNote` / `removeStatusNote` (MJ ou owner du perso).
 *
 * Minuteur persistant : `timerStartedAt` = instant de reprise (null = pause).
 * Start/pause accumulent dans `elapsedSeconds` — pas d'écriture par seconde.
 */

"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { campaigns, gameSessions, statusNotes } from "@/db/schema";
import { auth } from "@/lib/auth";
import { assertCanEdit } from "./guards";

type ActionResult<T> = ({ ok: true } & T) | { ok: false; reason: string };

async function requireMJ() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "mj") throw new Error("FORBIDDEN_MJ_ONLY");
  return session;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

// ---------------- updateCampaignStatus ----------------

export type CampaignStatusPatch = Partial<{
  threatLevel: number;
  partyMorale: number;
  questsActive: number;
  downtimeDays: number;
}>;

export async function updateCampaignStatus(
  campaignId: string,
  patch: CampaignStatusPatch,
): Promise<ActionResult<Record<never, never>>> {
  await requireMJ();
  const current = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
  });
  if (!current) return { ok: false, reason: "Campagne introuvable" };

  await db
    .update(campaigns)
    .set({
      threatLevel: clamp(patch.threatLevel ?? current.threatLevel, 0, 5),
      partyMorale: clamp(patch.partyMorale ?? current.partyMorale, 0, 5),
      questsActive: clamp(patch.questsActive ?? current.questsActive, 0, 99),
      downtimeDays: clamp(patch.downtimeDays ?? current.downtimeDays, 0, 999),
    })
    .where(eq(campaigns.id, campaignId));

  revalidatePath("/mj");
  return { ok: true };
}

// ---------------- setActiveCampaign ----------------

export async function setActiveCampaign(
  campaignId: string,
): Promise<ActionResult<Record<never, never>>> {
  await requireMJ();
  await db.update(campaigns).set({ isActive: 0 });
  await db
    .update(campaigns)
    .set({ isActive: 1 })
    .where(eq(campaigns.id, campaignId));
  revalidatePath("/mj");
  return { ok: true };
}

// ---------------- createCampaign ----------------

export async function createCampaign(
  name: string,
): Promise<ActionResult<{ id: string }>> {
  await requireMJ();
  const clean = (name ?? "").trim();
  if (!clean) return { ok: false, reason: "Nom de campagne requis" };
  if (clean.length > 80) return { ok: false, reason: "Nom trop long (80 max)" };

  await db.update(campaigns).set({ isActive: 0 });
  const [created] = await db
    .insert(campaigns)
    .values({ name: clean, isActive: 1 })
    .returning({ id: campaigns.id });
  await db
    .insert(gameSessions)
    .values({ campaignId: created.id, number: 1, isActive: 1 });

  revalidatePath("/mj");
  return { ok: true, id: created.id };
}

// ---------------- advanceSession ----------------

export async function advanceSession(
  campaignId: string,
): Promise<ActionResult<{ number: number }>> {
  await requireMJ();
  const current = await db.query.gameSessions.findFirst({
    where: and(
      eq(gameSessions.campaignId, campaignId),
      eq(gameSessions.isActive, 1),
    ),
  });
  const nextNumber = (current?.number ?? 0) + 1;

  await db
    .update(gameSessions)
    .set({ isActive: 0 })
    .where(eq(gameSessions.campaignId, campaignId));
  await db
    .insert(gameSessions)
    .values({ campaignId, number: nextNumber, isActive: 1 });

  revalidatePath("/mj");
  return { ok: true, number: nextNumber };
}

// ---------------- minuteur ----------------

export async function startSessionTimer(
  sessionId: string,
): Promise<ActionResult<Record<never, never>>> {
  await requireMJ();
  const s = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
  });
  if (!s) return { ok: false, reason: "Séance introuvable" };
  if (s.timerStartedAt) return { ok: true }; // déjà en cours
  await db
    .update(gameSessions)
    .set({ timerStartedAt: new Date() })
    .where(eq(gameSessions.id, sessionId));
  revalidatePath("/mj");
  return { ok: true };
}

export async function pauseSessionTimer(
  sessionId: string,
): Promise<ActionResult<{ elapsedSeconds: number }>> {
  await requireMJ();
  const s = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
  });
  if (!s) return { ok: false, reason: "Séance introuvable" };
  if (!s.timerStartedAt) return { ok: true, elapsedSeconds: s.elapsedSeconds };

  const add = Math.max(
    0,
    Math.floor((Date.now() - s.timerStartedAt.getTime()) / 1000),
  );
  const elapsedSeconds = s.elapsedSeconds + add;
  await db
    .update(gameSessions)
    .set({ elapsedSeconds, timerStartedAt: null })
    .where(eq(gameSessions.id, sessionId));
  revalidatePath("/mj");
  return { ok: true, elapsedSeconds };
}

// ---------------- notes de statut ----------------

export async function addStatusNote(
  characterId: string,
  text: string,
): Promise<ActionResult<{ id: string }>> {
  const { session } = await assertCanEdit(characterId);
  const clean = (text ?? "").trim();
  if (!clean) return { ok: false, reason: "Note vide" };
  if (clean.length > 280) return { ok: false, reason: "Note trop longue (280 max)" };

  const [created] = await db
    .insert(statusNotes)
    .values({
      characterId,
      text: clean,
      authorUserId: session.user.id,
      authorName: session.user.name ?? "—",
    })
    .returning({ id: statusNotes.id });

  revalidatePath("/mj");
  revalidatePath("/me");
  return { ok: true, id: created.id };
}

export async function removeStatusNote(
  noteId: string,
): Promise<ActionResult<Record<never, never>>> {
  const sess = await auth();
  if (!sess?.user) throw new Error("UNAUTHORIZED");
  const note = await db.query.statusNotes.findFirst({
    where: eq(statusNotes.id, noteId),
  });
  if (!note) return { ok: false, reason: "Note introuvable" };
  await assertCanEdit(note.characterId);
  await db.delete(statusNotes).where(eq(statusNotes.id, noteId));
  revalidatePath("/mj");
  revalidatePath("/me");
  return { ok: true };
}
