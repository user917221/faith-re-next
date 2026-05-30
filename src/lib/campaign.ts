/**
 * Contexte de campagne du cockpit MJ (Phase 5).
 *
 * `getCampaignContext()` charge la campagne active + sa séance active, et
 * amorce paresseusement un défaut si la table est vide (aucune étape de seed
 * requise). Calcule le temps de session « live » (elapsed + course en cours).
 */
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  gameSessions,
  statusNotes,
  journalEntries,
  npcs,
  sessionLogs,
} from "@/db/schema";

export type CampaignSummary = { id: string; name: string };

export type CampaignContext = {
  campaign: {
    id: string;
    name: string;
    threatLevel: number;
    partyMorale: number;
    questsActive: number;
    downtimeDays: number;
  };
  session: {
    id: string;
    number: number;
    name: string | null;
    date: Date;
    elapsedSeconds: number; // valeur live (incl. course en cours)
    running: boolean;
  };
  campaigns: CampaignSummary[];
};

const DEFAULT_CAMPAIGN = {
  name: "Nuit des Étoiles Filantes",
  threatLevel: 4,
  partyMorale: 3,
  questsActive: 5,
  downtimeDays: 2,
};

export async function getCampaignContext(): Promise<CampaignContext> {
  // 1) Campagne active + liste complète en PARALLÈLE — la liste est indépendante
  //    de la campagne active (1 aller-retour Neon au lieu de 2).
  let [campaign, all] = await Promise.all([
    db.query.campaigns.findFirst({ where: eq(campaigns.isActive, 1) }),
    db
      .select({ id: campaigns.id, name: campaigns.name })
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt)),
  ]);
  // Repli : aucune active → une au hasard → sinon amorce un défaut.
  if (!campaign) campaign = await db.query.campaigns.findFirst();
  if (!campaign) {
    const [created] = await db
      .insert(campaigns)
      .values({ ...DEFAULT_CAMPAIGN, isActive: 1 })
      .returning();
    campaign = created;
    all = [{ id: created.id, name: created.name }];
  }

  // 2) Séance active de la campagne → sinon la plus récente → sinon séance 1.
  let session =
    (await db.query.gameSessions.findFirst({
      where: and(
        eq(gameSessions.campaignId, campaign.id),
        eq(gameSessions.isActive, 1),
      ),
    })) ??
    (await db.query.gameSessions.findFirst({
      where: eq(gameSessions.campaignId, campaign.id),
      orderBy: desc(gameSessions.number),
    }));
  if (!session) {
    const [created] = await db
      .insert(gameSessions)
      .values({ campaignId: campaign.id, number: 1, isActive: 1 })
      .returning();
    session = created;
  }

  const running = session.timerStartedAt !== null;
  const liveElapsed =
    session.elapsedSeconds +
    (running
      ? Math.max(
          0,
          Math.floor((Date.now() - session.timerStartedAt!.getTime()) / 1000),
        )
      : 0);

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      threatLevel: campaign.threatLevel,
      partyMorale: campaign.partyMorale,
      questsActive: campaign.questsActive,
      downtimeDays: campaign.downtimeDays,
    },
    session: {
      id: session.id,
      number: session.number,
      name: session.name ?? null,
      date: session.date,
      elapsedSeconds: liveElapsed,
      running,
    },
    campaigns: all,
  };
}

/** Charge le journal d'une campagne (récent d'abord). */
export async function loadJournalEntries(campaignId: string) {
  const rows = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.campaignId, campaignId))
    .orderBy(desc(journalEntries.createdAt))
    .limit(100);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    sessionNumber: r.sessionNumber,
    createdAt: r.createdAt,
  }));
}

/** Charge les PNJ d'une campagne (alphabétique). */
export async function loadNpcs(campaignId: string) {
  const rows = await db
    .select()
    .from(npcs)
    .where(eq(npcs.campaignId, campaignId))
    .orderBy(npcs.name);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    disposition: r.disposition,
    description: r.description,
  }));
}

export type SessionLogEntry = {
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
 * Charge les logs de session archivés d'une campagne (#88), du plus récent au
 * plus ancien (endedAt DESC, rolledAt DESC). Lecture seule pour l'onglet
 * « Logs de session ». La page /mj re-vérifie le rôle MJ avant d'appeler.
 */
export async function loadSessionLogs(
  campaignId: string,
): Promise<SessionLogEntry[]> {
  const rows = await db
    .select()
    .from(sessionLogs)
    .where(eq(sessionLogs.campaignId, campaignId))
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

/** Charge les notes de statut d'un perso (récentes d'abord). */
export async function loadStatusNotes(characterId: string) {
  const rows = await db
    .select()
    .from(statusNotes)
    .where(eq(statusNotes.characterId, characterId))
    .orderBy(desc(statusNotes.createdAt))
    .limit(30);
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    authorName: r.authorName,
    createdAt: r.createdAt,
  }));
}
