"use client";

import { useState, useTransition } from "react";
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
    border: string;
    accentRing: string;
    fillFrom: string;
    fillTo: string;
    type: VitalType;
    defaultStep: number;
  }
> = {
  hp: {
    label: "Santé",
    text: "text-blood-dried",
    border: "border-blood-dried/22",
    accentRing: "border-blood-dried/35",
    fillFrom: "#d57272",
    fillTo: "#7a3a3a",
    type: "hp",
    defaultStep: 1,
  },
  mhp: {
    label: "Mental",
    text: "text-amethyst",
    border: "border-amethyst/22",
    accentRing: "border-amethyst/35",
    fillFrom: "#b9a4e3",
    fillTo: "#5a4495",
    type: "mental",
    defaultStep: 1,
  },
  endu: {
    label: "Endurance",
    text: "text-celadon",
    border: "border-celadon/22",
    accentRing: "border-celadon/35",
    fillFrom: "#a9c8ac",
    fillTo: "#4f7053",
    type: "endu",
    defaultStep: 10,
  },
};

function VitalSigil({ kind }: { kind: VitalKey }) {
  if (kind === "hp") {
    return (
      <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5 C 9 2, 4 4, 4 9 C 4 14, 12 20, 12 20 C 12 20, 20 14, 20 9 C 20 4, 15 2, 12 5 Z" />
        <path d="M12 5 V 12" opacity="0.5" />
      </svg>
    );
  }
  if (kind === "mhp") {
    return (
      <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="7" />
        <path d="M12 5 L 12 19 M 5 12 L 19 12 M 7 7 L 17 17 M 7 17 L 17 7" opacity="0.55" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3 L 5 13 H 11 L 9 21 L 19 10 H 12 L 13 3 Z" />
    </svg>
  );
}

function DamageIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1 V 4 M8 12 V 15 M1 8 H 4 M12 8 H 15" />
    </svg>
  );
}
function HealIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 3 V 13 M3 8 H 13" />
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
      <div className="flex items-stretch overflow-hidden rounded-[--radius-sm] border border-gold-aged/18">
        <button
          type="button"
          aria-label="Diminuer le montant"
          onClick={() => step(-1)}
          disabled={isPending}
          className="focus-grimoire flex h-7 w-7 items-center justify-center text-parchment-dim transition-colors hover:bg-ink-far hover:text-gold-aged disabled:opacity-35"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          aria-label="Montant"
          min={1}
          max={999}
          value={amount}
          onChange={(e) => setAmount(clamp(parseInt(e.target.value || "0", 10)))}
          onFocus={(e) => e.currentTarget.select()}
          disabled={isPending}
          className="tabular h-7 w-12 border-x border-gold-aged/15 bg-ink-deep text-center text-[0.85rem] text-parchment outline-none focus-visible:border-gold-aged/45 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
        />
        <button
          type="button"
          aria-label="Augmenter le montant"
          onClick={() => step(1)}
          disabled={isPending}
          className="focus-grimoire flex h-7 w-7 items-center justify-center text-parchment-dim transition-colors hover:bg-ink-far hover:text-gold-aged disabled:opacity-35"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() => apply(-1)}
        disabled={isPending}
        aria-label={`Infliger ${amount} dégât(s)`}
        title={`Infliger ${amount} dégât(s)`}
        className="focus-grimoire flex h-7 items-center gap-1.5 rounded-[--radius-sm] border border-blood-dried/40 bg-blood-dried/15 px-2.5 text-blood-dried transition-colors hover:border-blood-dried/60 hover:bg-blood-dried/25 disabled:opacity-35"
      >
        <DamageIcon />
        <span className="font-display text-[0.62rem] uppercase tracking-[0.16em]">
          Dégât
        </span>
      </button>
      <button
        type="button"
        onClick={() => apply(1)}
        disabled={isPending}
        aria-label={`Soigner ${amount}`}
        title={`Soigner ${amount}`}
        className="focus-grimoire flex h-7 items-center gap-1.5 rounded-[--radius-sm] border border-celadon/40 bg-celadon/15 px-2.5 text-celadon transition-colors hover:border-celadon/60 hover:bg-celadon/25 disabled:opacity-35"
      >
        <HealIcon />
        <span className="font-display text-[0.62rem] uppercase tracking-[0.16em]">
          Soin
        </span>
      </button>
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
  const isCritical = pct < 10;

  return (
    <div
      className={`relative overflow-hidden rounded-[--radius-lg] border ${palette.border} bg-ink-near p-4 transition-all hover:-translate-y-px hover:${palette.accentRing} ${
        isCritical ? "ring-1 ring-blood-dried/25" : ""
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          background: `radial-gradient(ellipse at left center, ${palette.fillFrom}, transparent 60%)`,
        }}
      />
      <div className="relative z-[1] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[--radius-sm] border ${palette.accentRing} bg-ink-deep ${palette.text}`}
            aria-hidden
          >
            <span className="h-5 w-5">
              <VitalSigil kind={kind} />
            </span>
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-parchment-mute">
              {palette.label}
            </span>
            <div className="flex items-baseline gap-2">
              <span
                key={current}
                className={`big-number ${palette.text} ${
                  isLow ? "drop-shadow-[0_0_10px_currentColor]" : ""
                }`}
                style={{
                  animation: "vital-flash 0.25s ease-out",
                  fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                }}
              >
                {current}
              </span>
              <span className="font-display tabular text-base text-parchment-mute">
                / {max}
              </span>
              {isCritical && (
                <span className="font-display ml-1 text-[0.6rem] uppercase tracking-[0.2em] text-blood-dried animate-pulse">
                  Critique
                </span>
              )}
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

      {/* Barre fine en bas */}
      <div className="relative z-[1] mt-3 h-[3px] overflow-hidden rounded-full bg-ink-deep">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${palette.fillFrom}, ${palette.fillTo})`,
          }}
        />
      </div>

      {/* Adjuster mobile — sous le slot */}
      {onAdjust && (
        <div className="relative z-[1] mt-3 flex justify-end md:hidden">
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
 * Bento layout : 3 cards empilées avec big-number, sigil et VitalAdjuster.
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
