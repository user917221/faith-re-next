"use client";

import { useState, useTransition } from "react";

/**
 * Barre vitale game-UI — segmentée, animée, avec icône sigil inline.
 *
 * Modes :
 *  - `full`    : carte complète avec label, chiffres, et VitalAdjuster (input + boutons Dégât / Soin)
 *  - `compact` : barre fine sans contrôles (utilisé dans /plateau)
 *
 * Le VitalAdjuster remplace les anciens boutons +step / -step. L'utilisateur
 * tape un montant (ou ajuste via les − / +), puis frappe DÉGÂT ou SOIN.
 * Évite le spam clic en cas de gros impact.
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

const PALETTE: Record<Kind, { fillFrom: string; fillMid: string; fillTo: string; glow: string; text: string; valueColor: string; ring: string; label: string; defaultStep: number }> = {
  hp: {
    fillFrom: "#d94a4a",
    fillMid: "#b92d2d",
    fillTo: "#8f4747",
    glow: "rgba(230, 83, 83, 0.42)",
    text: "text-blood-dried",
    valueColor: "#8f4747",
    ring: "border-blood-dried/30",
    label: "Santé",
    defaultStep: 1,
  },
  mhp: {
    fillFrom: "#8f5de0",
    fillMid: "#7b48bf",
    fillTo: "#705893",
    glow: "rgba(154, 105, 232, 0.38)",
    text: "text-amethyst",
    valueColor: "#705893",
    ring: "border-amethyst/30",
    label: "Mental",
    defaultStep: 1,
  },
  endu: {
    fillFrom: "#1e83ed",
    fillMid: "#156cc9",
    fillTo: "#0f4f99",
    glow: "rgba(30, 131, 237, 0.45)",
    text: "text-celadon",
    valueColor: "#1e83ed",
    ring: "border-celadon/30",
    label: "Endurance",
    defaultStep: 10,
  },
};

function Sigil({ kind }: { kind: Kind }) {
  const stroke = "currentColor";
  if (kind === "hp") {
    return (
      <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor" aria-hidden>
        <path d="M12 21.15 L 10.98 20.24 C 6.52 16.25, 3.58 13.62, 3.58 9.58 C 3.58 6.38, 5.92 4.05, 9.02 4.05 C 10.78 4.05, 12.1 4.88, 12.88 6.1 C 13.66 4.88, 14.98 4.05, 16.74 4.05 C 19.84 4.05, 22.18 6.38, 22.18 9.58 C 22.18 13.62, 19.24 16.25, 14.78 20.24 L 12 21.15 Z" />
        <path
          d="M2.4 11.22 H 6.92 L 8.6 7.38 L 12.12 15.85 L 14.52 11.22 H 21.6"
          fill="none"
          stroke="var(--color-ink-near)"
          strokeWidth="2.25"
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />
      </svg>
    );
  }
  if (kind === "mhp") {
    return (
      <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor" aria-hidden>
        <path d="M11.05 4.32 C 9.1 3.62, 6.95 4.15, 5.52 5.55 C 4.18 6.88, 3.72 8.72, 4.12 10.32 C 2.88 11.2, 2.48 12.92, 3.25 14.32 C 3.95 15.6, 5.28 16.12, 6.48 15.92 C 7.05 17.05, 8.32 17.62, 9.62 17.32 C 10.18 18.12, 11.18 18.62, 12.18 18.4 C 12.78 18.28, 13.15 17.78, 13.15 17.12 L 13.15 6.3 C 13.15 5.35, 12.32 4.78, 11.05 4.32 Z" />
        <path d="M13.02 4.1 C 14.98 3.45, 17.15 4.05, 18.52 5.5 C 19.8 6.85, 20.18 8.7, 19.72 10.28 C 21.05 11.12, 21.52 12.88, 20.72 14.32 C 20.02 15.58, 18.7 16.08, 17.52 15.9 C 16.95 17.05, 15.68 17.62, 14.38 17.32 C 13.88 18.08, 12.98 18.58, 12.18 18.4 C 11.55 18.25, 11.2 17.78, 11.2 17.12 L 11.2 6.25 C 11.2 5.28, 11.82 4.5, 13.02 4.1 Z" opacity="0.92" />
        <path d="M9.35 17.08 C 9.9 19.05, 12.38 20.32, 14.95 19.75 C 16.32 19.45, 17.4 18.65, 17.92 17.65 C 16.88 17.72, 15.72 17.62, 14.5 17.32 C 12.65 16.88, 10.98 16.75, 9.35 17.08 Z" opacity="0.78" />
        <path d="M7.02 7.85 C 7.92 6.95, 9.35 6.72, 10.38 7.32" fill="none" stroke="var(--color-ink-near)" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M16.98 7.85 C 16.08 6.95, 14.65 6.72, 13.62 7.32" fill="none" stroke="var(--color-ink-near)" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M6.1 11.28 C 7.38 11.88, 8.95 11.58, 9.82 10.65" fill="none" stroke="var(--color-ink-near)" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M17.9 11.28 C 16.62 11.88, 15.05 11.58, 14.18 10.65" fill="none" stroke="var(--color-ink-near)" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M5.45 13.92 C 6.28 14.72, 7.82 14.78, 8.98 14.08 C 9.78 13.58, 10.1 12.9, 9.9 12.28" fill="none" stroke="var(--color-ink-near)" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M18.55 13.92 C 17.72 14.72, 16.18 14.78, 15.02 14.08 C 14.22 13.58, 13.9 12.9, 14.1 12.28" fill="none" stroke="var(--color-ink-near)" strokeWidth="1.35" strokeLinecap="round" />
        <path d="M12.15 6.45 V 16.85" fill="none" stroke="var(--color-ink-near)" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor" aria-hidden>
      <path d="M13.45 2.8 L 4.85 13.15 C 4.45 13.62, 4.8 14.35, 5.42 14.35 H 10.65 L 9.02 21.1 C 8.82 21.95, 9.9 22.48, 10.43 21.78 L 19.28 10.15 C 19.65 9.65, 19.3 8.95, 18.68 8.95 H 13.28 L 14.82 3.48 C 15.05 2.65, 14 2.1, 13.45 2.8 Z" />
    </svg>
  );
}

/* Petits SVG icônes pour les boutons Dégât / Soin */
function DamageIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4.1 7.15 C 4.1 4.7, 5.72 3.05, 8 3.05 C 10.28 3.05, 11.9 4.7, 11.9 7.15 C 11.9 8.5, 11.28 9.38, 10.3 9.92 V 11.35 H 5.7 V 9.92 C 4.72 9.38, 4.1 8.5, 4.1 7.15 Z" />
      <path d="M6.15 12.9 H 9.85" />
      <path d="M6.55 6.85 H 6.6 M9.4 6.85 H 9.45" />
      <path d="M8 8.5 L 7.55 9.35 H 8.45 L 8 8.5 Z" />
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

function SegmentedFill({
  pct,
  fillFrom,
  fillMid,
  fillTo,
  isLow,
}: {
  pct: number;
  fillFrom: string;
  fillMid: string;
  fillTo: string;
  isLow: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="relative h-full overflow-hidden rounded-full border border-gold-aged/10 bg-ink-deep/70"
      style={{
        boxShadow: `inset 0 0 10px rgba(0, 0, 0, 0.22), 0 0 10px ${fillTo}44`,
      }}
    >
      {/* Fill principal */}
      <div
        className="absolute inset-y-0 left-0 overflow-hidden rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${clamped}%`,
          backgroundImage: [
            `radial-gradient(circle at 62% 65%, ${fillFrom}cc 0 12%, transparent 30%)`,
            `radial-gradient(circle at 18% 35%, ${fillMid}cc 0 10%, transparent 28%)`,
            `linear-gradient(100deg, ${fillTo} 0%, ${fillMid} 44%, ${fillFrom} 74%, ${fillMid} 100%)`,
          ].join(", "),
          backgroundSize: "140% 100%, 160% 100%, 220% 100%",
          backgroundPosition: "0% 50%, 100% 50%, 0% 50%",
          boxShadow: `0 0 16px ${fillMid}dd, 0 0 34px ${fillMid}99, inset 0 0 14px ${fillTo}66`,
          animation: "vital-fluid 5.5s ease-in-out infinite",
        }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 w-1/2 rounded-full opacity-45 blur-sm"
          style={{
            left: "-35%",
            background: `radial-gradient(ellipse at center, ${fillFrom} 0%, transparent 68%)`,
            animation: "vital-fluid-orb 4.2s ease-in-out infinite",
          }}
        />
      </div>
      {/* Reflet subtil haut */}
      <div
        className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-full"
        style={{
          background:
            `linear-gradient(180deg, ${fillFrom}44 0%, transparent 100%)`,
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

/**
 * VitalAdjuster — widget input numérique + boutons Dégât / Soin.
 *
 * - Le nombre saisi représente un MONTANT (jamais une valeur absolue).
 * - − / + ajustent le montant entre 1 et 999.
 * - DÉGÂT applique `onAdjust(-amount)`. SOIN applique `onAdjust(+amount)`.
 */
function VitalAdjuster({
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
    <div className="grid w-full grid-cols-2 gap-2">
      <div className="col-span-2 grid grid-cols-[2rem_1fr_2rem] overflow-hidden rounded-[--radius-sm] border border-gold-aged/18 bg-ink-deep/45">
        <button
          type="button"
          aria-label="Diminuer le montant"
          onClick={() => step(-1)}
          disabled={isPending}
          className="focus-grimoire flex h-8 items-center justify-center text-parchment-dim transition-colors hover:bg-ink-far hover:text-gold-aged disabled:opacity-35"
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
          className="tabular h-8 border-x border-gold-aged/15 bg-transparent text-center text-[0.85rem] text-parchment outline-none focus-visible:border-gold-aged/45 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
        />
        <button
          type="button"
          aria-label="Augmenter le montant"
          onClick={() => step(1)}
          disabled={isPending}
          className="focus-grimoire flex h-8 items-center justify-center text-parchment-dim transition-colors hover:bg-ink-far hover:text-gold-aged disabled:opacity-35"
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
        className="focus-grimoire flex h-8 items-center justify-center gap-1.5 rounded-[--radius-sm] border border-blood-dried/45 bg-blood-dried/15 px-2.5 text-blood-dried transition-colors hover:border-blood-dried/70 hover:bg-blood-dried/25 disabled:opacity-35"
      >
        <DamageIcon />
        <span className="font-display text-[0.62rem] uppercase tracking-[0.16em]">Dégât</span>
      </button>
      <button
        type="button"
        onClick={() => apply(1)}
        disabled={isPending}
        aria-label={`Soigner ${amount}`}
        title={`Soigner ${amount}`}
        className="focus-grimoire flex h-8 items-center justify-center gap-1.5 rounded-[--radius-sm] border border-[#248a3d]/45 bg-[#248a3d]/15 px-2.5 text-[#248a3d] transition-colors hover:border-[#248a3d]/70 hover:bg-[#248a3d]/25 disabled:opacity-35"
      >
        <HealIcon />
        <span className="font-display text-[0.62rem] uppercase tracking-[0.16em]">Soin</span>
      </button>
    </div>
  );
}

export function VitalBar({ kind, current, max, label, compact, step, onAdjust }: Props) {
  const palette = PALETTE[kind];
  const pct = max > 0 ? (current / max) * 100 : 0;
  const isLow = pct < 25;
  const isCritical = pct < 10;
  const finalStep = step ?? palette.defaultStep;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`h-3.5 w-3.5 shrink-0 ${palette.text}`}
          style={{
            filter: `drop-shadow(0 0 5px ${palette.valueColor})`,
          }}
        >
          <Sigil kind={kind} />
        </span>
        <div className="relative flex-1 h-2">
          <SegmentedFill
            pct={pct}
            fillFrom={palette.fillFrom}
            fillMid={palette.fillMid}
            fillTo={palette.fillTo}
            isLow={isCritical}
          />
        </div>
        <span className={`tabular text-[0.7rem] tracking-tight ${palette.text}`}>
          <span
            className={isLow ? "font-bold" : ""}
            style={{
              color: palette.valueColor,
              textShadow: `0 0 10px ${palette.valueColor}80`,
            }}
          >
            {current}
          </span>
          <span className="text-parchment-faint">/{max}</span>
        </span>
      </div>
    );
  }

  // Mode full
  return (
    <div
      className={`relative card-grimoire overflow-hidden ${isCritical ? "ring-1 ring-blood-dried/20" : ""}`}
      style={{
        background:
          `radial-gradient(circle at 14% 18%, ${palette.valueColor}1a, transparent 42%), linear-gradient(180deg, rgba(58, 72, 94, 0.74) 0%, rgba(36, 48, 66, 0.64) 100%), var(--color-ink-edge)`,
        borderColor: "rgba(17, 17, 17, 0.34)",
        boxShadow:
          `inset 0 1px 0 rgba(255,255,255,0.16), 0 22px 54px -34px rgba(0,0,0,0.82), 0 0 26px -18px ${palette.valueColor}`,
      }}
    >
      {/* Glow d'ambiance derrière */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          background: `radial-gradient(ellipse at center, ${palette.glow}, transparent 70%)`,
        }}
      />

      <div className="relative z-[1] mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 items-center justify-center ${palette.text}`}
            style={{
              filter: `drop-shadow(0 0 7px ${palette.valueColor}) drop-shadow(0 0 14px ${palette.valueColor}99)`,
            }}
            aria-hidden
          >
            <Sigil kind={kind} />
          </span>
          <span className="label-grimoire text-parchment">{label ?? palette.label}</span>
        </div>
        {onAdjust && (
          <VitalAdjuster defaultAmount={finalStep} onAdjust={onAdjust} />
        )}
      </div>

      <div className="relative z-[1] mb-2 flex items-baseline gap-2">
        <span
          key={current}
          className={`font-display tabular text-4xl font-bold ${palette.text} ${isLow ? "drop-shadow-[0_0_10px_currentColor]" : ""}`}
          style={{
            animation: "vital-flash 0.25s ease-out",
            color: palette.valueColor,
            textShadow: `0 0 12px ${palette.valueColor}90, 0 0 28px ${palette.valueColor}55`,
          }}
        >
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
        <SegmentedFill
          pct={pct}
          fillFrom={palette.fillFrom}
          fillMid={palette.fillMid}
          fillTo={palette.fillTo}
          isLow={isCritical}
        />
      </div>
    </div>
  );
}

/**
 * Trio standard pour la fiche : Santé / Endurance / Mental.
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
        kind="hp"
        current={character.currentHp}
        max={character.maxHp}
        onAdjust={onVitalChange ? (d) => onVitalChange("hp", d) : undefined}
      />
      <VitalBar
        kind="endu"
        current={character.currentEndurance}
        max={character.maxEndurance}
        onAdjust={onVitalChange ? (d) => onVitalChange("endu", d) : undefined}
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
