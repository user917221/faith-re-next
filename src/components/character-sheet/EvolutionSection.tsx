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
    <section className="card-grimoire flex flex-col gap-5">
      <header className="flex items-baseline gap-3">
        <span className="label-grimoire">Évolution</span>
        <span className="text-[0.65rem] italic text-parchment-faint">
          (privé MJ)
        </span>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* XP / Niveau */}
        <div className="flex flex-col gap-3 border-r-0 border-gold-aged/10 md:border-r md:pr-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="font-display text-3xl font-bold leading-none text-gold-aged">
                Niveau {level}
              </p>
              <p className="mt-1.5 text-xs text-parchment-dim">
                Bonus PV / MHP : <span className="tabular text-parchment">+{bonus}</span>
              </p>
            </div>
            <div className="flex w-28 flex-col gap-1">
              <label htmlFor="evo-xp" className="font-display text-[0.65rem] uppercase tracking-[0.18em] text-parchment-mute">
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
                className="input-grimoire tabular w-full text-right disabled:opacity-40"
              />
            </div>
          </div>
          <div className="h-px overflow-hidden rounded-full bg-ink-deep">
            <div
              className="h-full bg-gold-aged transition-[width]"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-[0.7rem] text-parchment-mute">
            {isMaxLevel ? (
              <>Niveau max atteint (<span className="tabular">{character.xp}</span> XP)</>
            ) : (
              <>
                <span className="tabular">{character.xp}</span> /{" "}
                <span className="tabular">{nextXp}</span> XP — encore{" "}
                <span className="tabular text-gold-aged">{Math.max(0, nextXp - character.xp)}</span>{" "}
                XP pour Niv. {level + 1}
              </>
            )}
          </p>
        </div>

        {/* Endurance / Entraînements */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-medium leading-none text-celadon">
                {tier.label}
              </p>
              <p className="mt-1.5 text-xs text-parchment-dim">
                Max : <span className="tabular text-parchment">{character.maxEndurance}</span>
              </p>
            </div>
            <div className="flex w-28 flex-col gap-1">
              <span className="font-display text-[0.65rem] uppercase tracking-[0.18em] text-parchment-mute">
                Entraînements
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={
                    isPending || !onTrainingChange || character.enduranceTrainings <= 0
                  }
                  onClick={() => adjustTrainings(-1)}
                  className="btn-ghost flex h-8 w-7 items-center justify-center !p-0 text-sm font-bold disabled:opacity-35"
                >
                  −
                </button>
                <span className="tabular flex-1 rounded-[--radius-sm] border border-gold-aged/10 bg-ink-deep px-2 py-1 text-center text-sm font-semibold text-parchment">
                  {character.enduranceTrainings}
                </span>
                <button
                  type="button"
                  disabled={isPending || !onTrainingChange}
                  onClick={() => adjustTrainings(1)}
                  className="btn-ghost flex h-8 w-7 items-center justify-center !p-0 text-sm font-bold disabled:opacity-35"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <p className="text-[0.7rem] text-parchment-mute">
            {nextTier ? (
              <>
                <span className="tabular">{character.enduranceTrainings}</span> entraînement(s)
                — encore{" "}
                <span className="tabular text-gold-aged">
                  {nextTier.trainings - character.enduranceTrainings}
                </span>{" "}
                pour {nextTier.label} (<span className="tabular">{nextTier.max}</span>)
              </>
            ) : (
              <>
                Palier max atteint (<span className="tabular">{character.enduranceTrainings}</span>{" "}
                entraînements)
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
