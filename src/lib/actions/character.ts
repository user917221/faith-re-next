/**
 * Server Actions — mutations sur un personnage FAITH : RE.
 *
 * Toutes les actions vérifient l'auth (`assertCanEdit` ou `assertMJOnly`),
 * appliquent la règle métier (cap 80 sur skills, paliers d'endurance, etc.),
 * écrivent en BDD via Drizzle, puis invalident les routes `/me` et `/mj`.
 *
 * Toute action peut renvoyer `{ ok: false, reason }` pour un refus métier
 * (cap, valeur hors borne…). Les erreurs auth lèvent une exception (catch
 * côté caller pour rediriger ou afficher un toast).
 */

"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  characters,
  characterSkills,
  conditions,
  campaigns,
  gameSessions,
  sessionLogs,
} from "@/db/schema";
import {
  ENDURANCE_COSTS,
  calculateLevel,
  getEnduranceTier,
  HP_FLOOR,
  type ActionType,
} from "@/lib/faith-system";
import { countAllocatedPoints } from "@/lib/skills";
import { assertCanEdit, assertMJOnly } from "./guards";

type ActionResult<T> = ({ ok: true } & T) | { ok: false; reason: string };

const SKILL_CAP_TOTAL = 80;
const FATE_MIN = 0;
const FATE_MAX = 5;
const VITAL_HP_MAX = 200; // garde-fou — le max réel est dérivé runtime côté caller
const VITAL_MENTAL_MAX = 200;

// Condition Fatigue automatique : déclenchée si l'endurance courante tombe à ou
// sous (maxEndurance − 40), retirée dès qu'elle remonte au-dessus. Malus −4 au dé.
const FATIGUE_LABEL = "Fatigue";
const FATIGUE_THRESHOLD_MARGIN = 40;
const FATIGUE_DICE_MODIFIER = -4;

function revalidateAll() {
  revalidatePath("/me");
  revalidatePath("/mj");
}

/**
 * Gère la condition « Fatigue » selon le seuil d'endurance.
 * Ajoute la condition (debuff, −4 au dé) si endurance ≤ maxEndurance − 40 et
 * absente ; la retire si endurance repasse au-dessus et présente. Idempotent.
 */
async function manageFatigueCondition(
  characterId: string,
  newEndurance: number,
  maxEndurance: number,
): Promise<void> {
  const threshold = maxEndurance - FATIGUE_THRESHOLD_MARGIN;
  const shouldHaveFatigue = newEndurance <= threshold;

  const existing = await db.query.conditions.findFirst({
    where: and(
      eq(conditions.characterId, characterId),
      eq(conditions.label, FATIGUE_LABEL),
    ),
  });

  if (shouldHaveFatigue && !existing) {
    await db.insert(conditions).values({
      characterId,
      label: FATIGUE_LABEL,
      kind: "debuff",
      diceModifier: FATIGUE_DICE_MODIFIER,
    });
  } else if (!shouldHaveFatigue && existing) {
    await db.delete(conditions).where(eq(conditions.id, existing.id));
  }
}

/**
 * Journalise une perte de PV (dégâts subis) dans `session_log`, rattachée à la
 * session active de la campagne active. 1 ligne par perte, `damageValue` = PV
 * réellement perdus. Affichée dans l'onglet « Logs de session » (#87/#88).
 *
 * Best-effort : toute erreur (pas de campagne/session active, écriture KO) est
 * avalée — journaliser ne doit JAMAIS casser la mise à jour des PV.
 */
async function logHpDamage(
  characterId: string,
  characterName: string,
  amount: number,
  actorUserId: string | null,
  actorName: string,
): Promise<void> {
  try {
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.isActive, 1),
    });
    if (!campaign) return; // pas de campagne active → rien à rattacher
    const gs = await db.query.gameSessions.findFirst({
      where: and(
        eq(gameSessions.campaignId, campaign.id),
        eq(gameSessions.isActive, 1),
      ),
    });
    if (!gs) return; // pas de session active

    const now = new Date();
    await db.insert(sessionLogs).values({
      campaignId: campaign.id,
      gameSessionId: gs.id,
      sessionNumber: gs.number,
      casterUserId: actorUserId,
      characterId,
      casterName: actorName,
      characterName,
      diceFormula: "Dégâts",
      diceRolls: [],
      diceTotal: 0,
      damageValue: amount,
      dd: null,
      success: null,
      isCritSucc: 0,
      isCritFail: 0,
      rolledAt: now,
      endedAt: now,
      createdByUserId: actorUserId,
    });
  } catch {
    // best-effort : on n'interrompt jamais l'update vital sur un échec de log.
  }
}

// ---------------- updateSkill ----------------

export async function updateSkill(
  characterId: string,
  skillName: string,
  delta: 1 | -1,
): Promise<ActionResult<{ newValue: number; totalAllocated: number }>> {
  await assertCanEdit(characterId);

  // Charge tous les skills du perso pour calculer le total alloué.
  const rows = await db
    .select()
    .from(characterSkills)
    .where(eq(characterSkills.characterId, characterId));

  const skillsMap: Record<string, number> = {};
  for (const r of rows) skillsMap[r.skillName] = r.points;

  const current = skillsMap[skillName] ?? 0;
  const totalCurrent = countAllocatedPoints(skillsMap);

  if (delta === 1) {
    if (totalCurrent + 1 > SKILL_CAP_TOTAL) {
      return { ok: false, reason: "Cap 80 atteint" };
    }
  } else {
    // delta === -1 : si déjà à 0, no-op silencieux (le skill reste à 0).
    if (current <= 0) {
      return { ok: true, newValue: 0, totalAllocated: totalCurrent };
    }
  }

  const newValue = current + delta;

  // Upsert : si la ligne existe → update, sinon insert.
  await db
    .insert(characterSkills)
    .values({ characterId, skillName, points: newValue })
    .onConflictDoUpdate({
      target: [characterSkills.characterId, characterSkills.skillName],
      set: { points: newValue },
    });

  await db
    .update(characters)
    .set({ updatedAt: new Date() })
    .where(eq(characters.id, characterId));

  revalidateAll();

  return {
    ok: true,
    newValue,
    totalAllocated: totalCurrent + delta,
  };
}

// ---------------- updateVital ----------------

export async function updateVital(
  characterId: string,
  type: "hp" | "mental" | "endu",
  delta: number,
): Promise<ActionResult<{ newValue: number }>> {
  const { character, session } = await assertCanEdit(characterId);

  let current: number;
  let max: number;
  if (type === "hp") {
    current = character.currentHp;
    max = VITAL_HP_MAX;
  } else if (type === "mental") {
    current = character.currentMental;
    max = VITAL_MENTAL_MAX;
  } else {
    current = character.currentEndurance;
    // endu : max dérivé du tier d'entraînement
    max = getEnduranceTier(character.enduranceTrainings).max;
  }

  // Les PV peuvent descendre en négatif jusqu'à HP_FLOOR (-21, système de mort) ;
  // Mental et Endurance restent plancher 0.
  const floor = type === "hp" ? HP_FLOOR : 0;
  const newValue = Math.max(floor, Math.min(max, current + delta));
  const now = new Date();

  // Set TS-safe par variant : Drizzle attend les noms de propriété du schema,
  // pas les noms de colonne SQL — un `[column.name]: …` dynamique ne marcherait pas.
  if (type === "hp") {
    await db
      .update(characters)
      .set({ currentHp: newValue, updatedAt: now })
      .where(eq(characters.id, characterId));
  } else if (type === "mental") {
    await db
      .update(characters)
      .set({ currentMental: newValue, updatedAt: now })
      .where(eq(characters.id, characterId));
  } else {
    await db
      .update(characters)
      .set({ currentEndurance: newValue, updatedAt: now })
      .where(eq(characters.id, characterId));
  }

  // Fatigue automatique : seuil d'endurance (max − 40). Seul updateVital pilote
  // l'endurance via l'UI, donc c'est le bon point d'ancrage.
  if (type === "endu") {
    await manageFatigueCondition(characterId, newValue, max);
  }

  // Dégâts subis : toute perte de PV réelle est journalisée dans les logs de
  // session (PV avant − PV après ; gère l'overkill : capé à la perte effective).
  if (type === "hp") {
    const hpLost = current - newValue;
    if (hpLost > 0) {
      const actorName =
        session.user.role === "mj" ? "MJ" : session.user.name ?? "—";
      await logHpDamage(
        characterId,
        character.name,
        hpLost,
        session.user.id ?? null,
        actorName,
      );
    }
  }

  revalidateAll();

  return { ok: true, newValue };
}

// ---------------- applyEnduranceAction ----------------

export async function applyEnduranceAction(
  characterId: string,
  actionType: ActionType,
): Promise<
  ActionResult<{ newEndurance: number; cost: number; label: string }>
> {
  const { character } = await assertCanEdit(characterId);

  const spec = ENDURANCE_COSTS[actionType];
  if (!spec) {
    return { ok: false, reason: `Action inconnue : ${actionType}` };
  }

  const cost = spec.cost;
  const newEndurance = Math.max(0, character.currentEndurance - cost);

  await db
    .update(characters)
    .set({ currentEndurance: newEndurance, updatedAt: new Date() })
    .where(eq(characters.id, characterId));

  revalidateAll();

  return { ok: true, newEndurance, cost, label: spec.label };
}

// ---------------- updateXp (MJ) ----------------

export async function updateXp(
  characterId: string,
  newXp: number,
): Promise<
  ActionResult<{
    xp: number;
    level: number;
    previousLevel: number;
    levelChanged: boolean;
  }>
> {
  const { character } = await assertMJOnly(characterId);

  if (!Number.isFinite(newXp) || newXp < 0) {
    return { ok: false, reason: "XP doit être un entier positif" };
  }

  const xpInt = Math.floor(newXp);
  const previousLevel = calculateLevel(character.xp);
  const level = calculateLevel(xpInt);

  await db
    .update(characters)
    .set({ xp: xpInt, updatedAt: new Date() })
    .where(eq(characters.id, characterId));

  revalidateAll();

  return {
    ok: true,
    xp: xpInt,
    level,
    previousLevel,
    levelChanged: level !== previousLevel,
  };
}

// ---------------- updateTrainings (MJ) ----------------

export async function updateTrainings(
  characterId: string,
  delta: 1 | -1,
): Promise<
  ActionResult<{
    trainings: number;
    newMax: number;
    newLabel: string;
    tierChanged: boolean;
  }>
> {
  const { character } = await assertMJOnly(characterId);

  const current = character.enduranceTrainings;
  const next = Math.max(0, current + delta);

  if (next === current) {
    // Cas delta=-1 alors qu'on est déjà à 0 : pas de mutation, mais on
    // renvoie l'état actuel pour permettre au caller de refresh.
    const tier = getEnduranceTier(current);
    return {
      ok: true,
      trainings: current,
      newMax: tier.max,
      newLabel: tier.label,
      tierChanged: false,
    };
  }

  const previousTier = getEnduranceTier(current);
  const nextTier = getEnduranceTier(next);

  await db
    .update(characters)
    .set({ enduranceTrainings: next, updatedAt: new Date() })
    .where(eq(characters.id, characterId));

  revalidateAll();

  return {
    ok: true,
    trainings: next,
    newMax: nextTier.max,
    newLabel: nextTier.label,
    tierChanged: previousTier.label !== nextTier.label,
  };
}

// ---------------- updateFatePoints ----------------

export async function updateFatePoints(
  characterId: string,
  value: number,
): Promise<ActionResult<{ value: number }>> {
  await assertCanEdit(characterId);

  if (!Number.isFinite(value)) {
    return { ok: false, reason: "Valeur Fate invalide" };
  }

  const clamped = Math.max(FATE_MIN, Math.min(FATE_MAX, Math.floor(value)));

  await db
    .update(characters)
    .set({ fatePoints: clamped, updatedAt: new Date() })
    .where(eq(characters.id, characterId));

  revalidateAll();

  return { ok: true, value: clamped };
}

// ---------------- updateRunes (MJ) ----------------

export async function updateRunes(
  characterId: string,
  runes: string[],
): Promise<ActionResult<{ runes: string[] }>> {
  await assertMJOnly(characterId);

  if (!Array.isArray(runes) || runes.some((r) => typeof r !== "string")) {
    return { ok: false, reason: "Runes doit être un tableau de strings" };
  }

  // Trim + dédup léger pour rester propre côté BDD.
  const cleaned = Array.from(
    new Set(runes.map((r) => r.trim()).filter((r) => r.length > 0)),
  );

  await db
    .update(characters)
    .set({ runes: cleaned, updatedAt: new Date() })
    .where(eq(characters.id, characterId));

  revalidateAll();

  return { ok: true, runes: cleaned };
}
