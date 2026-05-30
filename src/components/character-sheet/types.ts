/**
 * Types locaux du composant CharacterSheet.
 *
 * Note : on ne réutilise pas directement `Character` de `@/db/schema` parce que
 * la fiche affichée travaille avec un Character "hydraté" — les max vitals,
 * le niveau et la map skills sont déjà calculés par le parent (Server Action /
 * route loader).
 */
import type { ENDURANCE_COSTS } from "@/lib/faith-system";
import type { AttributeName } from "@/lib/skills";

export type Character = {
  id: string;
  name: string;
  nom: string;
  age: number;
  xp: number;
  level: number;
  enduranceTrainings: number;
  currentHp: number;
  currentMental: number;
  currentEndurance: number;
  maxHp: number;
  maxMental: number;
  maxEndurance: number;
  fatePoints: number;
  runes: string[];
  skills: Record<string, number>;
  isPresent: boolean;
  avatarUrl: string | null;
  // --- Flux (2e jauge magique) ---
  fluxTrainings: number;
  technicalTrainings: number;
  combatsReal: number;
  currentFlux: number;
  maxFlux: number; // dérivé du palier de Flux
  fluxPalier: number; // -1 = initial, 0..5
  fluxLabel: string; // "Initial" | "P0".."P5"
  technicalPalier: number;
  technicalLabel: string;
  tier: string; // "T{niveau}"
  // --- Stats de combat (Phase 2) ---
  initiative: number;
  armor: number;
  movement: number;
  proficiency: number;
  // --- Tags d'identité (Phase 2) ---
  race: string | null;
  pronouns: string | null;
  charClass: string | null;
  // --- Bio libre + notes joueur (Phase 6) ---
  bio: string | null;
  notes: string | null;
  // --- Conditions actives (Phase 2) ---
  conditions: ConditionItem[];
  // --- Inventaire de runes ---
  runesInventory: RuneItem[];
  // --- Inventaire d'objets (Phase 6) ---
  items: ItemEntry[];
};

export type ItemKind = "arme" | "armure" | "objet" | "consommable";

export type ItemEntry = {
  id: string;
  name: string;
  type: ItemKind;
  qty: number;
  equipped: boolean;
  description: string | null;
};

export type ConditionKind = "buff" | "debuff" | "wound" | "focus" | "neutral";

export type ConditionItem = {
  id: string;
  label: string;
  kind: ConditionKind;
};

export type CombatStatKey = "initiative" | "armor" | "movement" | "proficiency";

export type RuneItem = {
  id: string;
  name: string;
  type: "utilitaire" | "armement" | "predefinie";
  description: string | null;
};

export type ActionType = keyof typeof ENDURANCE_COSTS;
export type VitalType = "hp" | "mental" | "endu";

export type ProfilePatch = {
  name?: string;
  nom?: string;
  age?: number;
  race?: string;
  pronouns?: string;
  charClass?: string;
  bio?: string;
  notes?: string;
  avatarUrl?: string;
};

export type PendingTrainingRequest = {
  id: string;
  requestedAt: Date;
  note: string | null;
};

export type CharacterSheetProps = {
  character: Character;
  isMJ: boolean;
  pendingTraining?: PendingTrainingRequest | null;
  onSkillChange?: (skillName: string, delta: 1 | -1) => Promise<void>;
  onVitalChange?: (type: VitalType, delta: number) => Promise<void>;
  onActionCost?: (actionType: ActionType) => Promise<void>;
  onXpChange?: (newXp: number) => Promise<void>;
  onTrainingChange?: (delta: 1 | -1) => Promise<void>;
  onFateChange?: (value: number) => Promise<void>;
  onRuneChange?: (index: number, value: string) => Promise<void>;
  onProfileChange?: (patch: ProfilePatch) => Promise<void>;
  onRequestTraining?: (note?: string) => Promise<void>;
  // --- Flux & inventaire de runes ---
  onFluxChange?: (delta: number) => Promise<void>;
  onFluxTrainingChange?: (delta: 1 | -1) => Promise<void>;
  onCombatChange?: (delta: 1 | -1) => Promise<void>;
  onTechnicalChange?: (delta: 1 | -1) => Promise<void>;
  onAddRune?: (input: {
    name: string;
    type: "utilitaire" | "armement" | "predefinie";
    description?: string;
  }) => Promise<void>;
  onRemoveRune?: (runeId: string) => Promise<void>;
  // --- Combat & conditions (Phase 2) ---
  onCombatStatChange?: (key: CombatStatKey, delta: number) => Promise<void>;
  onAddCondition?: (input: {
    label: string;
    kind: ConditionKind;
  }) => Promise<void>;
  onRemoveCondition?: (conditionId: string) => Promise<void>;
  // --- Inventaire d'objets (Phase 6) ---
  onAddItem?: (input: {
    name: string;
    type: ItemKind;
    qty?: number;
    description?: string;
  }) => Promise<void>;
  onRemoveItem?: (itemId: string) => Promise<void>;
  onToggleEquip?: (itemId: string) => Promise<void>;
  onUpdateItemQty?: (itemId: string, delta: number) => Promise<void>;
  onRecoverHp?: () => Promise<{ gain: number; d1: number; d2: number; ecaille: number; newHp: number; maxHp: number }>;
  onRecoverEndurance?: () => Promise<{ gain: number; roll: number; newEndurance: number; maxEndurance: number }>;
  onTogglePresence?: () => Promise<void>;
  onRollSkill?: (input: {
    attrName: AttributeName;
    skillName?: string | null;
    dd: number | null;
  }) => Promise<void>;
};
