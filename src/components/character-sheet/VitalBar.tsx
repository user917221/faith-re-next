"use client";

import { useTransition } from "react";

/**
 * Barre vitale game-UI — segmentée, animée, avec icône sigil inline.
 *
 * Modes :
 *  - `full`    : carte complète avec label, chiffres, boutons +/- (utilisé dans la fiche)
 *  - `compact` : barre fine sans contrôles (utilisé dans /plateau)
 */

type Kind = "hp" | "mhp" | "endu";

type Props = {
  kind: Kind;
  current: number;
  max: number;
  label?: string;
  compact?: boolean;
  step?: number;
  onAdjust?: (delta: number) => Promise<void>;
};

const PALETTE: Record<Kind, { fillFrom: string; fillTo: string; glow: string; text: string; ring: string; label: string; defaultStep: number }> = {
  hp: {
    fillFrom: "#d57272",
    fillTo: "#7a3a3a",
    glow: "rgba(179, 90, 90, 0.4)",
    text: "text-blood-dried",
    ring: "border-blood-dried/30",
    label: "Santé",
    defaultStep: 1,
  },
  mhp: {
    fillFrom: "#b9a4e3",
    fillTo: "#5a4495",
    glow: "rgba(155, 127, 208, 0.4)",
    text: "text-amethyst",
    ring: "border-amethyst/30",
    label: "Mental",
    defaultStep: 1,
  },
  endu: {
    fillFrom: "#a9c8ac",
    fillTo: "#4f7053",
    glow: "rgba(142, 176, 145, 0.4)",
    text: "text-celadon",
    ring: "border-celadon/30",
    label: "Endurance",
    defaultStep: 10,
  },
};

function Sigil({ kind }: { kind: Kind }) {
  // SVG sigils dessinés à la main — uniques, pas des emojis.
  const stroke = "currentColor";
  if (kind === "hp") {
    return (
      <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5 C 9 2, 4 4, 4 9 C 4 14, 12 20, 12 20 C 12 20, 20 14, 20 9 C 20 4, 15 2, 12 5 Z" />
        <path d="M12 5 V 12" opacity="0.5" />
      </svg>
    );
  }
  if (kind === "mhp") {
    return (
      <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="7" />
        <path d="M12 5 L 12 19 M 5 12 L 19 12 M 7 7 L 17 17 M 7 17 L 17 7" opacity="0.55" />
      </svg>
    );
  }
  // endu — éclair stylisé runique
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3 L 5 13 H 11 L 9 21 L 19 10 H 12 L 13 3 Z" />
    </svg>
  );
}

function SegmentedFill({ pct, fillFrom, fillTo, isLow }: { pct: number; fillFrom: string; fillTo: string; isLow: boolean }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative h-full overflow-hidden rounded-[--radius-xs] border border-gold-aged/15 bg-ink-deep">
      {/* Fill principal */}
      <div
        className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
        style={{
          width: `${clamped}%`,
          background: `linear-gradient(180deg, ${fillFrom} 0%, ${fillTo} 100%)`,
        }}
      />
      {/* Segmentation : 20 divisions */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0, transparent calc(5% - 1px), rgba(10,10,15,0.55) calc(5% - 1px), rgba(10,10,15,0.55) 5%)",
        }}
      />
      {/* Reflet subtil haut */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, transparent 100%)",
        }}
      />
      {/* Pulse low-health */}
      {isLow && clamped > 0 && (
        <div
          className="absolute inset-0 pointer-events-none animate-[vital-pulse_1.4s_ease-in-out_infinite]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
          }}
        />
      )}
    </div>
  );
}

export function VitalBar({ kind, current, max, label, compact, step, onAdjust }: Props) {
  const palette = PALETTE[kind];
  const pct = max > 0 ? (current / max) * 100 : 0;
  const isLow = pct < 25;
  const isCritical = pct < 10;
  const [isPending, startTransition] = useTransition();
  const finalStep = step ?? palette.defaultStep;

  function adjust(delta: number) {
    if (!onAdjust) return;
    startTransition(() => onAdjust(delta));
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`h-3.5 w-3.5 shrink-0 ${palette.text}`}>
          <Sigil kind={kind} />
        </span>
        <div className="relative flex-1 h-2">
          <SegmentedFill pct={pct} fillFrom={palette.fillFrom} fillTo={palette.fillTo} isLow={isCritical} />
        </div>
        <span className={`tabular text-[0.7rem] tracking-tight ${palette.text}`}>
          <span className={isLow ? "font-bold" : ""}>{current}</span>
          <span className="text-parchment-faint">/{max}</span>
        </span>
      </div>
    );
  }

  // Mode full
  return (
    <div className={`relative card-grimoire overflow-hidden ${isCritical ? "ring-1 ring-blood-dried/20" : ""}`}>
      {/* Glow d'ambiance derrière */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          background: `radial-gradient(ellipse at center, ${palette.glow}, transparent 70%)`,
        }}
      />

      <div className="relative z-[1] flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-[--radius-xs] border ${palette.ring} bg-ink-deep ${palette.text}`}
            aria-hidden
          >
            <Sigil kind={kind} />
          </span>
          <span className="label-grimoire">{label ?? palette.label}</span>
        </div>
        {onAdjust && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => adjust(-finalStep)}
              disabled={isPending}
              className="btn-ghost h-7 px-2.5 tabular text-[0.7rem]"
              aria-label={`Retirer ${finalStep}`}
            >
              −{finalStep}
            </button>
            <button
              type="button"
              onClick={() => adjust(finalStep)}
              disabled={isPending}
              className="btn-ghost h-7 px-2.5 tabular text-[0.7rem]"
              aria-label={`Ajouter ${finalStep}`}
            >
              +{finalStep}
            </button>
          </div>
        )}
      </div>

      <div className="relative z-[1] flex items-baseline gap-2 mb-2">
        <span className={`font-display tabular text-3xl font-bold ${palette.text} ${isLow ? "drop-shadow-[0_0_8px_currentColor]" : ""}`}>
          {current}
        </span>
        <span className="font-display tabular text-lg text-parchment-mute">
          / {max}
        </span>
        {isCritical && (
          <span className="ml-auto font-display text-[0.6rem] uppercase tracking-[0.2em] text-blood-dried animate-pulse">
            Critique
          </span>
        )}
      </div>

      <div className="relative z-[1] h-3">
        <SegmentedFill pct={pct} fillFrom={palette.fillFrom} fillTo={palette.fillTo} isLow={isCritical} />
      </div>
    </div>
  );
}

/**
 * Trio standard pour la fiche : 3 barres alignées Endurance / HP / MHP.
 */
export function VitalsTrio({
  character,
  onVitalChange,
}: {
  character: {
    currentEndurance: number;
    maxEndurance: number;
    currentHp: number;
    maxHp: number;
    currentMental: number;
    maxMental: number;
  };
  onVitalChange?: (type: "hp" | "mental" | "endu", delta: number) => Promise<void>;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <VitalBar
        kind="endu"
        current={character.currentEndurance}
        max={character.maxEndurance}
        onAdjust={onVitalChange ? (d) => onVitalChange("endu", d) : undefined}
      />
      <VitalBar
        kind="hp"
        current={character.currentHp}
        max={character.maxHp}
        onAdjust={onVitalChange ? (d) => onVitalChange("hp", d) : undefined}
      />
      <VitalBar
        kind="mhp"
        current={character.currentMental}
        max={character.maxMental}
        onAdjust={onVitalChange ? (d) => onVitalChange("mental", d) : undefined}
      />
    </div>
  );
}
