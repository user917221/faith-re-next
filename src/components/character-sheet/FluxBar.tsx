"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Barre de Flux — 2e jauge magique, distincte des vitaux.
 *
 * Le Flux est la « substance » neutre : couleur GRIS / BLANC, jamais lavande
 * (réservé au primary) ni couleur vitale (hp / mhp / endu). Track `bg-muted`,
 * fill `bg-foreground/70` (blanc cassé sobre).
 *
 * Modes :
 *  - `full`    : carte plate Linear avec label, badge palier, big-number et
 *                FluxAdjuster (−10 / +10 par défaut, dépense vs régénération).
 *  - `compact` : barre fine + chiffre tabular sans contrôles (plateau / roster).
 *
 * Inspiré de VitalBar mais volontairement plus léger côté contrôles : un seul
 * pas (±10) suffit pour dépenser ou régénérer du Flux.
 */

type Props = {
  current: number;
  max: number;
  palier: number;
  palierLabel: string;
  compact?: boolean;
  onAdjust?: (delta: number) => Promise<void>;
};

/** Sigil Flux — losange runique monochrome, neutre (pas de couleur vitale). */
function FluxSigil() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3 L 20 12 L 12 21 L 4 12 Z" />
      <path d="M12 7 L 16 12 L 12 17 L 8 12 Z" opacity="0.45" />
    </svg>
  );
}

/** Barre fine Linear — track bg-muted, fill blanc/gris neutre, radius-full. */
function FluxTrack({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-foreground/70 transition-all duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/**
 * FluxAdjuster — Input shadcn + boutons Dépenser / Régénérer.
 *
 * - Le nombre saisi représente un MONTANT (jamais une valeur absolue).
 * - − / + ajustent le montant entre 1 et 999.
 * - Dépenser applique `onAdjust(-amount)`. Régén applique `onAdjust(+amount)`.
 */
function FluxAdjuster({
  onAdjust,
}: {
  onAdjust: (delta: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState<number>(10);
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
          onClick={() => step(-10)}
          disabled={isPending}
        >
          −
        </Button>
        <Input
          type="number"
          inputMode="numeric"
          aria-label="Montant de Flux"
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
          onClick={() => step(10)}
          disabled={isPending}
        >
          +
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => apply(-1)}
        disabled={isPending}
        aria-label={`Dépenser ${amount} de Flux`}
        title={`Dépenser ${amount} de Flux`}
      >
        Dépenser
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => apply(1)}
        disabled={isPending}
        aria-label={`Régénérer ${amount} de Flux`}
        title={`Régénérer ${amount} de Flux`}
      >
        Régén
      </Button>
    </div>
  );
}

export function FluxBar({ current, max, palier, palierLabel, compact, onAdjust }: Props) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  // palier -1 = "Initial" (pas encore éveillé) → chip plus discret, en italique.
  const isInitial = palier < 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-ink-muted">
          <FluxSigil />
        </span>
        <div className="flex-1">
          <FluxTrack pct={pct} />
        </div>
        <span className="tabular text-xs">
          <span className="text-foreground">{current}</span>
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
          <span className="shrink-0 text-ink-muted" aria-hidden>
            <FluxSigil />
          </span>
          <span className="label-grimoire">Flux</span>
          <span
            className={`tabular rounded-md bg-muted px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground ${
              isInitial ? "italic opacity-80" : ""
            }`}
          >
            {palierLabel}
          </span>
        </div>
        {onAdjust && <FluxAdjuster onAdjust={onAdjust} />}
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="big-number tabular text-4xl font-semibold text-foreground">
          {current}
        </span>
        <span className="tabular text-lg text-muted-foreground">/ {max}</span>
      </div>

      <FluxTrack pct={pct} />
    </div>
  );
}
