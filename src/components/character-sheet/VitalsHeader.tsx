"use client";

import { useTransition } from "react";
import type { Character, VitalType } from "./types";

type Props = {
  character: Character;
  onVitalChange?: (type: VitalType, delta: number) => Promise<void>;
};

type Vital = {
  type: VitalType;
  label: string;
  current: number;
  max: number;
  step: number;
  color: string;
};

export function VitalsHeader({ character, onVitalChange }: Props) {
  const [isPending, startTransition] = useTransition();

  const vitals: Vital[] = [
    {
      type: "endu",
      label: "Endurance",
      current: character.currentEndurance,
      max: character.maxEndurance,
      step: 10,
      color: "text-cyan-400",
    },
    {
      type: "hp",
      label: "Santé (HP)",
      current: character.currentHp,
      max: character.maxHp,
      step: 1,
      color: "text-rose-400",
    },
    {
      type: "mental",
      label: "Mental",
      current: character.currentMental,
      max: character.maxMental,
      step: 1,
      color: "text-violet-400",
    },
  ];

  function adjust(type: VitalType, delta: number) {
    if (!onVitalChange) return;
    startTransition(async () => {
      await onVitalChange(type, delta);
    });
  }

  return (
    <section className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:grid-cols-3">
      {vitals.map((v) => (
        <div
          key={v.type}
          className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/20 px-4 py-3"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-white/60">
            {v.label}
          </span>
          <div className="flex items-baseline justify-between gap-3">
            <span className={`text-2xl font-extrabold ${v.color}`}>
              {v.current}/{v.max}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={isPending || !onVitalChange}
                onClick={() => adjust(v.type, -v.step)}
                className="flex h-7 w-9 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                -{v.step}
              </button>
              <button
                type="button"
                disabled={isPending || !onVitalChange}
                onClick={() => adjust(v.type, v.step)}
                className="flex h-7 w-9 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                +{v.step}
              </button>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
