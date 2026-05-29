"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Character, VitalType } from "./types";

type Props = {
  character: Character;
  onVitalChange?: (type: VitalType, delta: number) => Promise<void>;
};

type VitalKey = "hp" | "mhp" | "endu";

const PALETTE: Record<
  VitalKey,
  {
    label: string;
    text: string;
    fill: string;
    type: VitalType;
    defaultStep: number;
  }
> = {
  hp: {
    label: "Santé",
    text: "text-hp",
    fill: "bg-hp",
    type: "hp",
    defaultStep: 1,
  },
  mhp: {
    label: "Mental",
    text: "text-mhp",
    fill: "bg-mhp",
    type: "mental",
    defaultStep: 1,
  },
  endu: {
    label: "Endurance",
    text: "text-endu",
    fill: "bg-endu",
    type: "endu",
    defaultStep: 10,
  },
};

function VitalSigil({ kind }: { kind: VitalKey }) {
  if (kind === "hp") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 5 C 9 2, 4 4, 4 9 C 4 14, 12 20, 12 20 C 12 20, 20 14, 20 9 C 20 4, 15 2, 12 5 Z" />
        <path d="M12 5 V 12" opacity="0.5" />
      </svg>
    );
  }
  if (kind === "mhp") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="7" />
        <path d="M12 5 L 12 19 M 5 12 L 19 12 M 7 7 L 17 17 M 7 17 L 17 7" opacity="0.55" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13 3 L 5 13 H 11 L 9 21 L 19 10 H 12 L 13 3 Z" />
    </svg>
  );
}

function MiniAdjuster({
  defaultAmount,
  onAdjust,
}: {
  defaultAmount: number;
  onAdjust: (delta: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [isPending, startTransition] = useTransition();

  function clamp(n: number) {
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(999, Math.round(n)));
  }
  function step(delta: number) {
    setAmount((a) => clamp(a + delta));
  }
  function apply(sign: 1 | -1) {
    startTransition(() => onAdjust(sign * amount));
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Diminuer le montant"
          onClick={() => step(-1)}
          disabled={isPending}
        >
          −
        </Button>
        <Input
          type="number"
          inputMode="numeric"
          aria-label="Montant"
          min={1}
          max={999}
          value={amount}
          onChange={(e) => setAmount(clamp(parseInt(e.target.value || "0", 10)))}
          onFocus={(e) => e.currentTarget.select()}
          disabled={isPending}
          className="tabular h-7 w-12 px-1 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Augmenter le montant"
          onClick={() => step(1)}
          disabled={isPending}
        >
          +
        </Button>
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => apply(-1)}
        disabled={isPending}
        aria-label={`Infliger ${amount} dégât(s)`}
        title={`Infliger ${amount} dégât(s)`}
      >
        Dégât
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => apply(1)}
        disabled={isPending}
        aria-label={`Soigner ${amount}`}
        title={`Soigner ${amount}`}
        className="text-endu hover:text-endu"
      >
        Soin
      </Button>
    </div>
  );
}

function VitalSlot({
  kind,
  current,
  max,
  onAdjust,
}: {
  kind: VitalKey;
  current: number;
  max: number;
  onAdjust?: (delta: number) => Promise<void>;
}) {
  const palette = PALETTE[kind];
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const isLow = pct < 25;

  return (
    <div className="card-grimoire p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`shrink-0 ${palette.text}`} aria-hidden>
            <VitalSigil kind={kind} />
          </span>
          <div className="flex flex-col gap-1">
            <span className="label-grimoire">{palette.label}</span>
            <div className="flex items-baseline gap-2">
              <span
                className={`big-number ${isLow ? palette.text : "text-foreground"}`}
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
              >
                {current}
              </span>
              <span className="tabular text-base text-muted-foreground">
                / {max}
              </span>
            </div>
          </div>
        </div>
        {onAdjust && (
          <div className="hidden md:block">
            <MiniAdjuster
              defaultAmount={palette.defaultStep}
              onAdjust={onAdjust}
            />
          </div>
        )}
      </div>

      {/* Barre fine Linear */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${palette.fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Adjuster mobile — sous le slot */}
      {onAdjust && (
        <div className="mt-3 flex justify-end md:hidden">
          <MiniAdjuster
            defaultAmount={palette.defaultStep}
            onAdjust={onAdjust}
          />
        </div>
      )}
    </div>
  );
}

/**
 * En-tête vital — trio vertical (HP, Mental, Endurance).
 * Cards plates Linear empilées : big-number, sigil monochrome et VitalAdjuster.
 */
export function VitalsHeader({ character, onVitalChange }: Props) {
  return (
    <div className="flex h-full flex-col gap-3">
      <VitalSlot
        kind="hp"
        current={character.currentHp}
        max={character.maxHp}
        onAdjust={
          onVitalChange ? (d) => onVitalChange("hp", d) : undefined
        }
      />
      <VitalSlot
        kind="mhp"
        current={character.currentMental}
        max={character.maxMental}
        onAdjust={
          onVitalChange ? (d) => onVitalChange("mental", d) : undefined
        }
      />
      <VitalSlot
        kind="endu"
        current={character.currentEndurance}
        max={character.maxEndurance}
        onAdjust={
          onVitalChange ? (d) => onVitalChange("endu", d) : undefined
        }
      />
    </div>
  );
}
