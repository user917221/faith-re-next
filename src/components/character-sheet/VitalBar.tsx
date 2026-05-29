"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Barre vitale — style Linear : barre fine sur surface-3, fill en couleur
 * sémantique (HP rouge / MHP cyan / Endurance vert), zéro gradient/segment/glow.
 *
 * Modes :
 *  - `full`    : carte plate avec label, big-number, et VitalAdjuster (Input + Dégât / Soin)
 *  - `compact` : barre fine + chiffre tabular sans contrôles (utilisé dans /plateau)
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

const PALETTE: Record<Kind, { fill: string; text: string; label: string; defaultStep: number }> = {
  hp: {
    fill: "bg-hp",
    text: "text-hp",
    label: "Santé",
    defaultStep: 1,
  },
  mhp: {
    fill: "bg-mhp",
    text: "text-mhp",
    label: "Mental",
    defaultStep: 1,
  },
  endu: {
    fill: "bg-endu",
    text: "text-endu",
    label: "Endurance",
    defaultStep: 10,
  },
};

function Sigil({ kind }: { kind: Kind }) {
  // SVG sigils dessinés à la main — accent monochrome discret.
  const stroke = "currentColor";
  if (kind === "hp") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 5 C 9 2, 4 4, 4 9 C 4 14, 12 20, 12 20 C 12 20, 20 14, 20 9 C 20 4, 15 2, 12 5 Z" />
        <path d="M12 5 V 12" opacity="0.5" />
      </svg>
    );
  }
  if (kind === "mhp") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="7" />
        <path d="M12 5 L 12 19 M 5 12 L 19 12 M 7 7 L 17 17 M 7 17 L 17 7" opacity="0.55" />
      </svg>
    );
  }
  // endu — éclair stylisé runique
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13 3 L 5 13 H 11 L 9 21 L 19 10 H 12 L 13 3 Z" />
    </svg>
  );
}

/** Barre fine Linear — track surface-3, fill couleur sémantique, radius-full. */
function VitalTrack({ pct, fill }: { pct: number; fill: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${fill}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/**
 * VitalAdjuster — Input shadcn + boutons Dégât / Soin.
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

export function VitalBar({ kind, current, max, label, compact, step, onAdjust }: Props) {
  const palette = PALETTE[kind];
  const pct = max > 0 ? (current / max) * 100 : 0;
  const isLow = pct < 25;
  const finalStep = step ?? palette.defaultStep;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`shrink-0 ${palette.text}`}>
          <Sigil kind={kind} />
        </span>
        <div className="flex-1">
          <VitalTrack pct={pct} fill={palette.fill} />
        </div>
        <span className="tabular text-xs">
          <span className={isLow ? `font-semibold ${palette.text}` : "text-foreground"}>{current}</span>
          <span className="text-muted-foreground">/{max}</span>
        </span>
      </div>
    );
  }

  // Mode full — card plate Linear
  return (
    <div className="card-grimoire">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={`shrink-0 ${palette.text}`} aria-hidden>
            <Sigil kind={kind} />
          </span>
          <span className="label-grimoire">{label ?? palette.label}</span>
        </div>
        {onAdjust && (
          <VitalAdjuster defaultAmount={finalStep} onAdjust={onAdjust} />
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className={`tabular text-4xl font-semibold ${isLow ? palette.text : "text-foreground"}`}>
          {current}
        </span>
        <span className="tabular text-lg text-muted-foreground">
          / {max}
        </span>
      </div>

      <VitalTrack pct={pct} fill={palette.fill} />
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
