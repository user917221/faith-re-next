"use client";

import { useTransition } from "react";
import { SKILL_DESCRIPTIONS, SKILL_TO_ATTRIBUTE } from "@/lib/skills";
import { DDPopover } from "./DDPopover";

type Props = {
  name: string;
  value: number;
  attrScore: number;
  isCapped: boolean;
  onSkillChange?: (skillName: string, delta: 1 | -1) => Promise<void>;
  onRollSkill?: (input: {
    attrName: import("@/lib/skills").AttributeName;
    skillName?: string | null;
    dd: number | null;
  }) => Promise<void>;
};

/* SVG mini-dé pour le bouton de jet */
function DieIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
      <circle cx="5.5" cy="5.5" r="0.6" fill="currentColor" />
      <circle cx="10.5" cy="5.5" r="0.6" fill="currentColor" />
      <circle cx="8" cy="8" r="0.6" fill="currentColor" />
      <circle cx="5.5" cy="10.5" r="0.6" fill="currentColor" />
      <circle cx="10.5" cy="10.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function SkillRow({ name, value, attrScore, isCapped, onSkillChange, onRollSkill }: Props) {
  const [isPending, startTransition] = useTransition();
  const description = SKILL_DESCRIPTIONS[name] ?? "";
  const attrName = SKILL_TO_ATTRIBUTE[name];

  function adjust(delta: 1 | -1) {
    if (!onSkillChange) return;
    if (delta === 1 && isCapped) return;
    if (delta === -1 && value <= 0) return;
    startTransition(async () => {
      await onSkillChange(name, delta);
    });
  }

  const plusDisabled = isPending || !onSkillChange || isCapped;
  const minusDisabled = isPending || !onSkillChange || value <= 0;
  const totalBonus = attrScore + value;

  return (
    <div className="group flex items-center justify-between gap-3 text-sm">
      <span
        title={description}
        className="flex cursor-help items-center gap-2 font-medium text-parchment transition-colors hover:text-gold-bright"
      >
        <span aria-hidden className="text-gold-soft text-xs">
          ✦
        </span>
        {name}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Retirer un point de ${name}`}
          disabled={minusDisabled}
          onClick={() => adjust(-1)}
          className="btn-ghost focus-grimoire flex h-6 w-6 items-center justify-center !p-0 text-xs font-bold disabled:opacity-35"
        >
          −
        </button>
        <span className="tabular w-5 text-center font-semibold text-gold-aged">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Ajouter un point à ${name}`}
          disabled={plusDisabled}
          onClick={() => adjust(1)}
          className="btn-ghost focus-grimoire flex h-6 w-6 items-center justify-center !p-0 text-xs font-bold disabled:opacity-35"
        >
          +
        </button>
        {onRollSkill && attrName && (
          <DDPopover
            title={name}
            bonus={totalBonus}
            bonusLabel={`${attrName}+${name}`}
            onRoll={async (dd) =>
              onRollSkill({ attrName, skillName: name, dd })
            }
            trigger={
              <button
                type="button"
                aria-label={`Lancer 2d6 + ${name}`}
                title={`Lancer 2d6 + ${attrName} + ${name}`}
                className="focus-grimoire flex h-6 w-6 items-center justify-center rounded-[--radius-xs] border border-gold-aged/18 text-gold-aged transition-colors hover:border-gold-aged/45 hover:bg-gold-aged/10 hover:text-gold-bright"
              >
                <DieIcon />
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}
