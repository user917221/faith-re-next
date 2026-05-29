"use client";

import { useState } from "react";
import type { AttributeName } from "@/lib/skills";
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
import { DDDrawer, type RollContext } from "./DDDrawer";
import type { CharacterSheetProps } from "./types";

type DrawerCtx = RollContext & {
  attrName: AttributeName;
  skillName: string | null;
};

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

  const [drawerCtx, setDrawerCtx] = useState<DrawerCtx | null>(null);
  const openRollDrawer = onRollSkill ? (ctx: DrawerCtx) => setDrawerCtx(ctx) : undefined;

  return (
    <div className="relative z-[2] flex flex-col gap-2">
      {/* Header identité */}
      <header className="flex flex-wrap items-end justify-between gap-3 rounded-[--radius-xl] border border-gold-aged/12 bg-ink-near/35 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
        <div>
          <h1 className="font-display text-4xl font-black tracking-tight text-gold-aged">
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
        onOpenRollDrawer={openRollDrawer}
      />

      {onRollSkill && (
        <DDDrawer
          context={drawerCtx}
          onClose={() => setDrawerCtx(null)}
          onRoll={async (dd) => {
            if (!drawerCtx) return;
            await onRollSkill({
              attrName: drawerCtx.attrName,
              skillName: drawerCtx.skillName,
              dd,
            });
            setDrawerCtx(null);
          }}
        />
      )}

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
