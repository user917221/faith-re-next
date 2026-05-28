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
      color: "text-celadon",
    },
    {
      type: "hp",
      label: "Santé",
      current: character.currentHp,
      max: character.maxHp,
      step: 1,
      color: "text-blood-dried",
    },
    {
      type: "mental",
      label: "Mental",
      current: character.currentMental,
      max: character.maxMental,
      step: 1,
      color: "text-amethyst",
    },
  ];

  function adjust(type: VitalType, delta: number) {
    if (!onVitalChange) return;
    startTransition(async () => {
      await onVitalChange(type, delta);
    });
  }

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {vitals.map((v) => (
        <div key={v.type} className="card-grimoire flex flex-col gap-3">
          <span className="label-grimoire">{v.label}</span>
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className={`tabular text-3xl font-bold leading-none ${v.color}`}>
                {v.current}
              </span>
              <span className="text-parchment-mute text-base leading-none">/</span>
              <span className="tabular text-base font-medium text-parchment-mute leading-none">
                {v.max}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={isPending || !onVitalChange}
                onClick={() => adjust(v.type, -v.step)}
                className="btn-ghost !px-2 !py-1 text-[0.7rem] font-bold disabled:opacity-35"
              >
                −{v.step}
              </button>
              <button
                type="button"
                disabled={isPending || !onVitalChange}
                onClick={() => adjust(v.type, v.step)}
                className="btn-ghost !px-2 !py-1 text-[0.7rem] font-bold disabled:opacity-35"
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
