/**
 * Types locaux du composant CharacterSheet.
 *
 * Note : on ne réutilise pas directement `Character` de `@/db/schema` parce que
 * la fiche affichée travaille avec un Character "hydraté" — les max vitals,
 * le niveau et la map skills sont déjà calculés par le parent (Server Action /
 * route loader).
 */
import type { ENDURANCE_COSTS } from "@/lib/faith-system";

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
};

export type ActionType = keyof typeof ENDURANCE_COSTS;
export type VitalType = "hp" | "mental" | "endu";

export type ProfilePatch = {
  name?: string;
  nom?: string;
  age?: number;
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
};
