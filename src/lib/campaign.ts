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
  // 1) Campagne active → sinon une au hasard → sinon amorce un défaut.
  let campaign =
    (await db.query.campaigns.findFirst({ where: eq(campaigns.isActive, 1) })) ??
    (await db.query.campaigns.findFirst());
  if (!campaign) {
    const [created] = await db
      .insert(campaigns)
      .values({ ...DEFAULT_CAMPAIGN, isActive: 1 })
      .returning();
    campaign = created;
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

  const all = await db
    .select({ id: campaigns.id, name: campaigns.name })
    .from(campaigns)
    .orderBy(desc(campaigns.createdAt));

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
