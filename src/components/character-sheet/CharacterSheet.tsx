"use client";

import { countAllocatedPoints } from "@/lib/skills";
import { SKILL_CAP, calculateLevel } from "@/lib/faith-system";
import { VitalsHeader } from "./VitalsHeader";
import { EnduranceActionPanel } from "./EnduranceActionPanel";
import { PointAllocatorBar } from "./PointAllocatorBar";
import { AttributesGrid } from "./AttributesGrid";
import { EvolutionSection } from "./EvolutionSection";
import { ProfileEditor } from "./ProfileEditor";
import { TrainingRequestButton } from "./TrainingRequestButton";
import { RecoveryPanel } from "./RecoveryPanel";
import { PresenceBadge } from "./PresenceBadge";
import type { CharacterSheetProps } from "./types";

function SigilDivider({ mark = "✦" }: { mark?: string }) {
  return (
    <div className="sigil-divider">
      <span className="sigil-mark">{mark}</span>
    </div>
  );
}

export default function CharacterSheet({
  character,
  isMJ,
  pendingTraining,
  onSkillChange,
  onVitalChange,
  onActionCost,
  onXpChange,
  onTrainingChange,
  onProfileChange,
  onRequestTraining,
  onRecoverHp,
  onRecoverEndurance,
  onTogglePresence,
  onRollSkill,
}: CharacterSheetProps) {
  const allocated = countAllocatedPoints(character.skills);
  const isCapped = allocated >= SKILL_CAP;
  const derivedLevel = calculateLevel(character.xp);

  return (
    <div className="relative z-[2] flex flex-col gap-2">
      {/* Header identité */}
      <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-[0.02em] text-gold-aged">
            {character.name}
            {character.nom ? ` ${character.nom}` : ""}
          </h1>
          <p className="mt-1 text-sm text-parchment-mute">
            {character.age || "?"} ans{isMJ ? ` · Niveau ${derivedLevel}` : ""}
          </p>
        </div>
        <span className="font-display relative flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.22em] text-gold-aged before:inline-block before:h-px before:w-6 before:bg-gold-soft after:inline-block after:h-px after:w-6 after:bg-gold-soft">
          {isMJ ? "Vue MJ" : "Vue joueur"}
        </span>
      </header>

      {onTogglePresence && (
        <PresenceBadge isPresent={character.isPresent} onToggle={onTogglePresence} />
      )}

      <SigilDivider mark="✦" />
      <VitalsHeader character={character} onVitalChange={onVitalChange} />

      {(onRecoverHp || onRecoverEndurance) && (
        <>
          <SigilDivider mark="✚" />
          <RecoveryPanel onRecoverHp={onRecoverHp} onRecoverEndurance={onRecoverEndurance} />
        </>
      )}

      <SigilDivider mark="✧" />
      <EnduranceActionPanel onActionCost={onActionCost} />

      <SigilDivider mark="✦" />
      <PointAllocatorBar allocated={allocated} />

      <SigilDivider mark="⚜" />
      <AttributesGrid
        character={character}
        isCapped={isCapped}
        onSkillChange={onSkillChange}
        onRollSkill={onRollSkill}
      />

      {!isMJ && onRequestTraining && (
        <>
          <SigilDivider mark="✧" />
          <TrainingRequestButton
            pending={pendingTraining ?? null}
            onRequestTraining={onRequestTraining}
          />
        </>
      )}

      <SigilDivider mark="✦" />
      <ProfileEditor character={character} onProfileChange={onProfileChange} />

      {isMJ && (
        <>
          <SigilDivider mark="⚜" />
          <EvolutionSection
            character={character}
            onXpChange={onXpChange}
            onTrainingChange={onTrainingChange}
          />
        </>
      )}
    </div>
  );
}
