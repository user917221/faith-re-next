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

import { and, eq, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  campaigns,
  gameSessions,
  statusNotes,
  publicRolls,
  sessionLogs,
} from "@/db/schema";
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

/** Remet le minuteur à zéro et relance le cycle depuis le début. */
export async function resetSessionTimer(
  sessionId: string,
): Promise<ActionResult<Record<never, never>>> {
  await requireMJ();
  await db
    .update(gameSessions)
    .set({ elapsedSeconds: 0, timerStartedAt: new Date() })
    .where(eq(gameSessions.id, sessionId));
  revalidatePath("/mj");
  return { ok: true };
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

// ---------------- renameCampaign ----------------

/**
 * renameCampaign — renomme une campagne existante (MJ).
 * Max 80 chars (cohérent avec createCampaign).
 */
export async function renameCampaign(
  campaignId: string,
  name: string,
): Promise<ActionResult<Record<never, never>>> {
  await requireMJ();
  const c = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
  });
  if (!c) return { ok: false, reason: "Campagne introuvable" };

  const clean = (name ?? "").trim();
  if (!clean) return { ok: false, reason: "Nom de campagne requis" };
  if (clean.length > 80) return { ok: false, reason: "Nom trop long (80 max)" };

  await db
    .update(campaigns)
    .set({ name: clean })
    .where(eq(campaigns.id, campaignId));

  revalidatePath("/mj");
  return { ok: true };
}

// ---------------- renameSession (#85) ----------------

/**
 * renameSession — renomme une session existante (MJ). Nom libre, optionnel :
 * vide → repasse à NULL (l'UI affiche le fallback « Session N »).
 * Max 80 chars (cohérent avec createCampaign).
 */
export async function renameSession(
  sessionId: string,
  name: string,
): Promise<ActionResult<Record<never, never>>> {
  await requireMJ();
  const s = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
  });
  if (!s) return { ok: false, reason: "Session introuvable" };

  const clean = (name ?? "").trim();
  if (clean.length > 80) return { ok: false, reason: "Nom trop long (80 max)" };

  await db
    .update(gameSessions)
    .set({ name: clean.length ? clean : null })
    .where(eq(gameSessions.id, sessionId));

  revalidatePath("/mj");
  return { ok: true };
}

// ---------------- deleteSession ----------------

/**
 * deleteSession — supprime une session (MJ). Les logs archivés (session_log)
 * sont CONSERVÉS (gameSessionId → NULL par FK). Interdit de supprimer la
 * dernière session d'une campagne. Si la session active est supprimée, la plus
 * récente restante redevient active.
 */
export async function deleteSession(
  sessionId: string,
): Promise<ActionResult<{ remaining: number }>> {
  await requireMJ();
  const s = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
  });
  if (!s) return { ok: false, reason: "Session introuvable" };

  const all = await db
    .select({ id: gameSessions.id })
    .from(gameSessions)
    .where(eq(gameSessions.campaignId, s.campaignId));
  if (all.length <= 1) {
    return { ok: false, reason: "Impossible de supprimer la dernière session." };
  }

  await db.delete(gameSessions).where(eq(gameSessions.id, sessionId));

  // Si on a supprimé la session active, réactive la plus récente restante.
  if (s.isActive === 1) {
    const next = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.campaignId, s.campaignId),
      orderBy: desc(gameSessions.number),
    });
    if (next) {
      await db
        .update(gameSessions)
        .set({ isActive: 1 })
        .where(eq(gameSessions.id, next.id));
    }
  }

  revalidatePath("/mj");
  revalidatePath("/plateau");
  return { ok: true, remaining: all.length - 1 };
}

// ---------------- endSession (#87) ----------------

/**
 * endSession — « Fin de session » (MJ). Archive TOUS les jets actuellement en
 * table (`public_roll`) dans `session_log` (1 ligne par jet), puis VIDE la
 * table des dés. Idempotent : table vide → { archived: 0, deletedRolls: 0 }.
 *
 * Neon HTTP ne supporte pas les transactions multi-statements : on lit les
 * jets, on insère les logs, puis on supprime les jets archivés (par leurs ids).
 * En pratique le risque de course est négligeable (action MJ unique).
 *
 * Heure : `endedAt` = instant ISO (timestamptz, UTC). Formatage Europe/Paris
 * fr-FR à l'affichage (cf. getSessionLogs / SessionLogsView).
 */
export async function endSession(sessionId: string): Promise<
  ActionResult<{ archived: number; deletedRolls: number; archivedAt: string }>
> {
  const session = await requireMJ();

  const gs = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
  });
  if (!gs) return { ok: false, reason: "Session introuvable" };

  const rolls = await db
    .select()
    .from(publicRolls)
    .orderBy(desc(publicRolls.createdAt));

  const endedAt = new Date();

  if (rolls.length === 0) {
    return {
      ok: true,
      archived: 0,
      deletedRolls: 0,
      archivedAt: endedAt.toISOString(),
    };
  }

  // Copie intégrale de chaque jet (replay/audit) dans session_log.
  await db.insert(sessionLogs).values(
    rolls.map((r) => ({
      campaignId: gs.campaignId,
      gameSessionId: gs.id,
      sessionNumber: gs.number,
      casterUserId: r.casterUserId,
      characterId: r.characterId,
      casterName: r.casterName,
      characterName: r.characterName,
      diceFormula: r.formula,
      diceRolls: r.rolls,
      diceTotal: r.total,
      damageValue: null,
      dd: r.dd,
      success: r.success,
      isCritSucc: r.isCritSucc,
      isCritFail: r.isCritFail,
      rolledAt: r.createdAt,
      endedAt,
      createdByUserId: session.user.id,
    })),
  );

  // Vide la table des dés (jets archivés). On supprime toutes les lignes lues.
  const ids = rolls.map((r) => r.id);
  await db.delete(publicRolls).where(inArray(publicRolls.id, ids));

  revalidatePath("/plateau");
  revalidatePath("/mj");

  return {
    ok: true,
    archived: rolls.length,
    deletedRolls: ids.length,
    archivedAt: endedAt.toISOString(),
  };
}

// ---------------- getSessionLogs (#88) ----------------

export type SessionLogDisplay = {
  id: string;
  gameSessionId: string | null;
  sessionNumber: number;
  casterName: string;
  characterName: string;
  characterId: string | null;
  diceFormula: string;
  diceRolls: number[];
  diceTotal: number;
  damageValue: number | null;
  dd: number | null;
  success: boolean | null;
  isCritSucc: boolean;
  isCritFail: boolean;
  rolledAt: Date;
  endedAt: Date;
};

/**
 * getSessionLogs — lit les logs archivés (MJ), filtrés par campagne si fournie,
 * triés du plus récent au plus ancien (endedAt DESC, puis rolledAt DESC).
 * Lecture pour l'onglet « Logs de session » (#88).
 */
export async function getSessionLogs(
  campaignId?: string,
): Promise<SessionLogDisplay[]> {
  await requireMJ();

  const rows = await db
    .select()
    .from(sessionLogs)
    .where(campaignId ? eq(sessionLogs.campaignId, campaignId) : undefined)
    .orderBy(desc(sessionLogs.endedAt), desc(sessionLogs.rolledAt))
    .limit(1000);

  return rows.map((r) => ({
    id: r.id,
    gameSessionId: r.gameSessionId,
    sessionNumber: r.sessionNumber,
    casterName: r.casterName,
    characterName: r.characterName,
    characterId: r.characterId,
    diceFormula: r.diceFormula,
    diceRolls: r.diceRolls,
    diceTotal: r.diceTotal,
    damageValue: r.damageValue,
    dd: r.dd,
    success: r.success === null ? null : r.success === 1,
    isCritSucc: r.isCritSucc === 1,
    isCritFail: r.isCritFail === 1,
    rolledAt: r.rolledAt,
    endedAt: r.endedAt,
  }));
}
