"use client";

import { countAllocatedPoints } from "@/lib/skills";
import { SKILL_CAP, calculateLevel } from "@/lib/faith-system";
import { VitalsHeader } from "./VitalsHeader";
import { EnduranceActionPanel } from "./EnduranceActionPanel";
import { PointAllocatorBar } from "./PointAllocatorBar";
import { AttributesGrid } from "./AttributesGrid";
import { EvolutionSection } from "./EvolutionSection";
import type { CharacterSheetProps } from "./types";

export default function CharacterSheet({
  character,
  isMJ,
  onSkillChange,
  onVitalChange,
  onActionCost,
  onXpChange,
  onTrainingChange,
}: CharacterSheetProps) {
  const allocated = countAllocatedPoints(character.skills);
  const isCapped = allocated >= SKILL_CAP;
  const derivedLevel = calculateLevel(character.xp);

  return (
    <div className="flex flex-col gap-6 text-white">
      {/* Header identité */}
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {character.name}
            {character.nom ? ` ${character.nom}` : ""}
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {character.age || "?"} ans · Niveau {derivedLevel}
          </p>
        </div>
        <span className="rounded-md border border-cyan-400/30 bg-cyan-400/[0.08] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
          {isMJ ? "Vue MJ" : "Vue joueur"}
        </span>
      </header>

      <VitalsHeader
        character={character}
        isMJ={isMJ}
        onVitalChange={onVitalChange}
      />

      <EnduranceActionPanel onActionCost={onActionCost} />

      <PointAllocatorBar allocated={allocated} />

      <AttributesGrid
        character={character}
        isCapped={isCapped}
        onSkillChange={onSkillChange}
      />

      {isMJ && (
        <EvolutionSection
          character={character}
          onXpChange={onXpChange}
          onTrainingChange={onTrainingChange}
        />
      )}
    </div>
  );
}
