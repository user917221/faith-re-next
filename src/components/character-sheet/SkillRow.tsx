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
    <div className="flex items-center justify-between text-sm">
      <span
        title={description}
        className="cursor-help font-medium text-white/70 transition-colors hover:text-cyan-400 hover:underline"
      >
        <span aria-hidden>🎲</span> {name}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Retirer un point de ${name}`}
          disabled={minusDisabled}
          onClick={() => adjust(-1)}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-white transition-colors hover:border-violet-400 hover:bg-violet-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-white/5"
        >
          −
        </button>
        <span className="w-5 text-center font-bold text-white">{value}</span>
        <button
          type="button"
          aria-label={`Ajouter un point à ${name}`}
          disabled={plusDisabled}
          onClick={() => adjust(1)}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-white transition-colors hover:border-violet-400 hover:bg-violet-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-white/5"
        >
          +
        </button>
      </div>
    </div>
  );
}
