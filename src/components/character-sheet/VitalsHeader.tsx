"use client";

import type { Character, VitalType } from "./types";
import { VitalsTrio } from "./VitalBar";

type Props = {
  character: Character;
  onVitalChange?: (type: VitalType, delta: number) => Promise<void>;
};

/**
 * En-tête vital de la fiche — trio de barres game-UI (Endurance/HP/MHP).
 * Style sigil + jauge segmentée + glow ambiance, voir <VitalBar>.
 */
export function VitalsHeader({ character, onVitalChange }: Props) {
  return <VitalsTrio character={character} onVitalChange={onVitalChange} />;
}
