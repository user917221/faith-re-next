/**
 * Constantes du système FAITH : RE.
 * Source unique de vérité, partagée entre frontend et backend.
 */

// --- Vitals ---
export const BASE_HP = 40;
export const BASE_MHP = 40;
export const SKILL_CAP = 80;
export const ENDURANCE_DEFAULT_MAX = 250;

// --- XP / Niveau ---
export const XP_THRESHOLDS = [0, 500, 1000, 2000, 3000, 4000] as const;
export const LEVEL_BONUS = [0, 20, 40, 80, 160, 320] as const;

// --- Paliers d'Endurance (du plus haut au plus bas) ---
export const ENDURANCE_TIERS = [
  { trainings: 15, max: 3000, label: "Anomalie" },
  { trainings: 10, max: 2000, label: "Sur-humaine" },
  { trainings: 7,  max: 1000, label: "Sur-entraînée" },
  { trainings: 5,  max: 750,  label: "Optimisée" },
  { trainings: 3,  max: 500,  label: "Disciplinée" },
  { trainings: 2,  max: 250,  label: "Défaut" },
] as const;

// --- Coûts d'endurance par action ---
export const ENDURANCE_COSTS = {
  physique: { label: "Action Physique", cost: 10 },
  off_r:    { label: "Offensive Réussie", cost: 20 },
  off_nr:   { label: "Offensive Non-réussie", cost: 30 },
  off_c:    { label: "Offensive Contrée", cost: 40 },
  def_r:    { label: "Défensive Réussie", cost: 10 },
  def_nr:   { label: "Défensive Non-réussie", cost: 20 },
  esq_r:    { label: "Esquive Réussie", cost: 5 },
  esq_nr:   { label: "Esquive Non-réussie", cost: 10 },
} as const;

export type ActionType = keyof typeof ENDURANCE_COSTS;

// --- Calculs dérivés ---
export function calculateLevel(xp: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if ((xp ?? 0) >= XP_THRESHOLDS[i]) return i;
  }
  return 0;
}

export function getLevelBonus(level: number): number {
  return LEVEL_BONUS[Math.min(Math.max(0, level), LEVEL_BONUS.length - 1)];
}

export function getEnduranceTier(trainings: number) {
  for (const tier of ENDURANCE_TIERS) {
    if ((trainings ?? 0) >= tier.trainings) return tier;
  }
  return { trainings: 0, max: ENDURANCE_DEFAULT_MAX, label: "Initiale" } as const;
}

export function nextLevelXp(level: number): number {
  const idx = Math.min(level + 1, XP_THRESHOLDS.length - 1);
  return XP_THRESHOLDS[idx];
}

export function nextEnduranceTier(trainings: number) {
  const ascending = [...ENDURANCE_TIERS].reverse();
  for (const tier of ascending) {
    if (tier.trainings > (trainings ?? 0)) return tier;
  }
  return null;
}
