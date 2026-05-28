"use client";

import { useState, useTransition } from "react";
import {
  XP_THRESHOLDS,
  calculateLevel,
  getEnduranceTier,
  getLevelBonus,
  nextEnduranceTier,
  nextLevelXp,
} from "@/lib/faith-system";
import type { Character } from "./types";

type Props = {
  character: Character;
  onXpChange?: (newXp: number) => Promise<void>;
  onTrainingChange?: (delta: 1 | -1) => Promise<void>;
};

export function EvolutionSection({
  character,
  onXpChange,
  onTrainingChange,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [xpDraft, setXpDraft] = useState<string>(String(character.xp));

  // Niveau dérivé du XP — toujours recalculé, pas pris dans character.level
  // pour éviter les désynchros entre champ stocké et XP réel.
  const level = calculateLevel(character.xp);
  const bonus = getLevelBonus(level);
  const nextXp = nextLevelXp(level);
  const isMaxLevel = level >= XP_THRESHOLDS.length - 1;
  const xpProgress = isMaxLevel
    ? 100
    : Math.min(
        100,
        Math.round(
          ((character.xp - XP_THRESHOLDS[level]) /
            (nextXp - XP_THRESHOLDS[level])) *
            100,
        ),
      );

  const tier = getEnduranceTier(character.enduranceTrainings);
  const nextTier = nextEnduranceTier(character.enduranceTrainings);

  function commitXp() {
    if (!onXpChange) return;
    const parsed = Math.max(0, Math.floor(Number(xpDraft) || 0));
    if (parsed === character.xp) return;
    startTransition(async () => {
      await onXpChange(parsed);
    });
  }

  function adjustTrainings(delta: 1 | -1) {
    if (!onTrainingChange) return;
    if (delta === -1 && character.enduranceTrainings <= 0) return;
    startTransition(async () => {
      await onTrainingChange(delta);
    });
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/70">
        <span aria-hidden>📈</span>
        Évolution
        <span className="ml-1 text-[10px] font-normal normal-case tracking-normal text-white/40">
          (privé MJ)
        </span>
      </div>

      {/* XP / Niveau */}
      <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
        <div className="flex flex-1 flex-col gap-2">
          <label className="text-xs text-white/70">
            Niveau <strong className="text-cyan-400">{level}</strong> · Bonus
            PV/MHP : <strong className="text-white">+{bonus}</strong>
          </label>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-cyan-400 transition-[width]"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <span className="text-[11px] text-white/50">
            {isMaxLevel
              ? `Niveau max atteint (${character.xp} XP)`
              : `${character.xp} / ${nextXp} XP — encore ${Math.max(
                  0,
                  nextXp - character.xp,
                )} XP pour Niv. ${level + 1}`}
          </span>
        </div>
        <div className="flex w-full flex-col gap-1 md:w-40">
          <label htmlFor="evo-xp" className="text-xs text-white/70">
            XP total
          </label>
          <input
            id="evo-xp"
            type="number"
            min={0}
            step={50}
            value={xpDraft}
            disabled={isPending || !onXpChange}
            onChange={(e) => setXpDraft(e.target.value)}
            onBlur={commitXp}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white outline-none transition-colors focus:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </div>
      </div>

      {/* Endurance / Entraînements */}
      <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs text-white/70">
            Endurance : <strong className="text-cyan-400">{tier.label}</strong>{" "}
            ({character.maxEndurance} max)
          </label>
          <span className="text-[11px] text-white/50">
            {nextTier
              ? `${character.enduranceTrainings} entraînement(s) — encore ${
                  nextTier.trainings - character.enduranceTrainings
                } pour ${nextTier.label} (${nextTier.max})`
              : `Palier max atteint (${character.enduranceTrainings} entraînements)`}
          </span>
        </div>
        <div className="flex w-full flex-col gap-1 md:w-40">
          <label className="text-xs text-white/70">Entraînements</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={
                isPending || !onTrainingChange || character.enduranceTrainings <= 0
              }
              onClick={() => adjustTrainings(-1)}
              className="h-8 w-8 rounded-md border border-white/10 bg-white/[0.03] text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              −
            </button>
            <span className="flex-1 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-center text-sm font-semibold text-white">
              {character.enduranceTrainings}
            </span>
            <button
              type="button"
              disabled={isPending || !onTrainingChange}
              onClick={() => adjustTrainings(1)}
              className="h-8 w-8 rounded-md border border-white/10 bg-white/[0.03] text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
