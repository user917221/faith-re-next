/**
 * Constantes du système FAITH : RE.
 * Source unique de vérité, partagée entre frontend et backend.
 */

// --- Vitals ---
export const BASE_HP = 40;
export const BASE_MHP = 40;
export const SKILL_CAP = 80;

/** Cap d'allocation des compétences : 80 de base + 1 point de stat par niveau. */
export function getSkillCap(level: number): number {
  return SKILL_CAP + Math.max(0, level);
}
export const ENDURANCE_DEFAULT_MAX = 250;

// --- Vitalité / seuils de mort (système FAITH:RE) ---
// Les PV peuvent descendre en négatif jusqu'à HP_FLOOR ; Mort totale en dessous.
export const HP_FLOOR = -21;

export type VitalityKey =
  | "vivant"
  | "dernier_souffle"
  | "ko_total"
  | "mort_imminente"
  | "mort_totale";

export type VitalityState = {
  key: VitalityKey;
  label: string;
  /** Mécanique associée affichée à la table (null si aucune). */
  effect: string | null;
  /** État critique (≤ 15 PV) → affichage d'alerte rouge. */
  critical: boolean;
};

/**
 * État de vitalité dérivé des PV courants :
 *   16+      → Vivant (aucun état)
 *   1..15    → Dernier Souffle (malus +2 sur les dés physiques)
 *   0        → KO Total (1d100 sur la blessure ; impossible sur attaques ultimes)
 *   -1..-20  → Expérience de Mort Imminente (soignable par soins de haute performance)
 *   ≤ -21    → Mort totale
 */
export function getVitalityState(hp: number): VitalityState {
  if (hp <= -21)
    return { key: "mort_totale", label: "Mort totale", effect: null, critical: true };
  if (hp < 0)
    return {
      key: "mort_imminente",
      label: "Expérience de Mort Imminente",
      effect: "Soignable uniquement par soins de haute performance.",
      critical: true,
    };
  if (hp === 0)
    return {
      key: "ko_total",
      label: "KO Total",
      effect: "1d100 sur la blessure (impossible sur les attaques ultimes).",
      critical: true,
    };
  if (hp <= 15)
    return {
      key: "dernier_souffle",
      label: "Dernier Souffle",
      effect: "Malus +2 sur tous les dés physiques.",
      critical: true,
    };
  return { key: "vivant", label: "Vivant", effect: null, critical: false };
}

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

// ============================================================
//  FLUX — 2e jauge (ressource magique, gris/blanc "substance")
//  Le palier de Flux dépend de DEUX conditions : entraînements de Flux
//  ET combats réels. Le perso atteint le palier le plus haut dont les
//  deux conditions sont remplies. Le palier fixe la jauge max + débloque
//  les catégories de sorts.
// ============================================================

export const FLUX_DEFAULT_MAX = 100; // jauge initiale (avant P0)

/** Paliers de Flux, du plus haut au plus bas. */
export const FLUX_TIERS = [
  { palier: 5, fluxTrainings: 15, combats: 6, max: 3000, label: "P5" },
  { palier: 4, fluxTrainings: 10, combats: 5, max: 2000, label: "P4" },
  { palier: 3, fluxTrainings: 7,  combats: 4, max: 1000, label: "P3" },
  { palier: 2, fluxTrainings: 5,  combats: 3, max: 750,  label: "P2" },
  { palier: 1, fluxTrainings: 3,  combats: 2, max: 500,  label: "P1" },
  { palier: 0, fluxTrainings: 2,  combats: 1, max: 250,  label: "P0" },
] as const;

/**
 * Catégories de sorts débloquées par palier de Flux.
 * Index = palier minimal requis. Le coût est en points de Flux.
 */
export const SPELL_CATEGORIES = [
  { minPalier: 1, name: "Sorts simples",        cost: 100 },
  { minPalier: 2, name: "Sorts intermédiaires", cost: 150 },
  { minPalier: 3, name: "Sorts complexes",      cost: 250 },
  { minPalier: 4, name: "Sorts uniques",        cost: 350 },
  { minPalier: 5, name: "Inconnu",              cost: 500 },
] as const;

export type FluxTier = {
  palier: number;
  fluxTrainings: number;
  combats: number;
  max: number;
  label: string;
};

/**
 * Palier de Flux atteint : le plus haut dont les DEUX conditions
 * (entraînements de Flux ET combats réels) sont remplies.
 */
export function getFluxTier(fluxTrainings: number, combats: number): FluxTier {
  for (const tier of FLUX_TIERS) {
    if ((fluxTrainings ?? 0) >= tier.fluxTrainings && (combats ?? 0) >= tier.combats) {
      return tier;
    }
  }
  return { palier: -1, fluxTrainings: 0, combats: 0, max: FLUX_DEFAULT_MAX, label: "Initial" };
}

/** Prochain palier de Flux non atteint (pour la progression UI). */
export function nextFluxTier(fluxTrainings: number, combats: number): FluxTier | null {
  const current = getFluxTier(fluxTrainings, combats);
  const ascending = [...FLUX_TIERS].reverse();
  for (const tier of ascending) {
    if (tier.palier > current.palier) return tier;
  }
  return null;
}

/** Catégories de sorts accessibles à un palier de Flux donné. */
export function unlockedSpells(palier: number) {
  return SPELL_CATEGORIES.filter((c) => c.minPalier <= palier);
}

// ============================================================
//  TECHNIQUE — 3e compteur d'entraînement (paliers techniques).
//  Effet exact défini par le MJ en jeu ; on fournit la progression.
// ============================================================

export const TECHNICAL_TIERS = [
  { trainings: 15, palier: 5, label: "Maîtrise" },
  { trainings: 10, palier: 4, label: "Expert" },
  { trainings: 7,  palier: 3, label: "Avancé" },
  { trainings: 5,  palier: 2, label: "Confirmé" },
  { trainings: 3,  palier: 1, label: "Initié" },
  { trainings: 2,  palier: 0, label: "Novice" },
] as const;

export function getTechnicalTier(trainings: number) {
  for (const tier of TECHNICAL_TIERS) {
    if ((trainings ?? 0) >= tier.trainings) return tier;
  }
  return { trainings: 0, palier: -1, label: "Aucun" } as const;
}

// --- Tier global : bande de 5 niveaux (T1 = niv 1-5, T2 = 6-10, … T6 = 26-30).
// Le Tier n'est PAS le niveau : un perso niveau 2 est T1.
export function tierLabel(xp: number): string {
  const level = calculateLevel(xp);
  const tier = Math.max(1, Math.min(6, Math.ceil(level / 5)));
  return `T${tier}`;
}

// --- Types de runes (inventaire) ---
export const RUNE_TYPES = ["utilitaire", "armement", "predefinie"] as const;
export type RuneType = (typeof RUNE_TYPES)[number];
export const RUNE_TYPE_LABEL: Record<RuneType, string> = {
  utilitaire: "Utilitaire",
  armement: "Armement",
  predefinie: "Prédéfinie",
};
