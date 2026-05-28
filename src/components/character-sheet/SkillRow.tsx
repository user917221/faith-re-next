"use client";

import { useTransition } from "react";
import { SKILL_DESCRIPTIONS } from "@/lib/skills";

type Props = {
  name: string;
  value: number;
  isCapped: boolean;
  onSkillChange?: (skillName: string, delta: 1 | -1) => Promise<void>;
};

export function SkillRow({ name, value, isCapped, onSkillChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const description = SKILL_DESCRIPTIONS[name] ?? "";

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

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
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
          className="btn-ghost flex h-6 w-6 items-center justify-center !p-0 text-xs font-bold disabled:opacity-35"
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
          className="btn-ghost flex h-6 w-6 items-center justify-center !p-0 text-xs font-bold disabled:opacity-35"
        >
          +
        </button>
      </div>
    </div>
  );
}
