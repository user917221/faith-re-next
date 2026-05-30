/**
 * Re-exports des Server Actions FAITH : RE.
 *
 * Permet `import { updateSkill, rollSkillCheck } from "@/lib/actions"`.
 * Les helpers `guards.ts` ne sont volontairement pas ré-exportés ici
 * (usage interne). Pour les utiliser : `import { assertCanEdit } from "@/lib/actions/guards"`.
 */

export {
  updateSkill,
  updateVital,
  applyEnduranceAction,
  updateXp,
  updateTrainings,
  updateFatePoints,
  updateRunes,
} from "./character";

export { rollSkillCheck, rollCustomFormula } from "./roll";

export { updateProfile } from "./profile";

export { recoverHp, recoverEndurance } from "./recovery";

export { togglePresence } from "./presence";

export { rollSkillWithDD } from "./roll-skill-dd";

export {
  updateFluxTrainings,
  updateCombats,
  updateTechnicalTrainings,
  updateFlux,
} from "./flux";

export {
  addRune,
  removeRune,
  updateRune,
  updateLightCrystals,
  addCompetenceAlea,
  removeCompetenceAlea,
} from "./runes";

export { addItem, removeItem, toggleEquip, updateItemQty } from "./items";

export {
  addJournalEntry,
  removeJournalEntry,
  addNpc,
  removeNpc,
  updateNpc,
} from "./world";

export { updateCharacterFull, type FullCharacterPatch } from "./admin";

export {
  updateCombatStats,
  addCondition,
  removeCondition,
  type CombatStatsPatch,
} from "./combat";

export {
  updateCampaignStatus,
  setActiveCampaign,
  createCampaign,
  advanceSession,
  startSessionTimer,
  pauseSessionTimer,
  resetSessionTimer,
  addStatusNote,
  removeStatusNote,
  type CampaignStatusPatch,
} from "./campaign";

export {
  requestTraining,
  approveTraining,
  rejectTraining,
  listTrainingRequestsForMJ,
  listTrainingRequestsForCharacter,
  type TrainingRequestWithChar,
} from "./training";
