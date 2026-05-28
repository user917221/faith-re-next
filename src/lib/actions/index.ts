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
