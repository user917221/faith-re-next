"use client";

import { useState, useEffect, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { CountUp } from "./CountUp";

/**
 * Jauge vitale circulaire — arc avec gap bas (compteur sobre, design v0).
 * CONTRÔLÉE : la valeur affichée vient toujours des props (source de vérité serveur).
 * Si `onAdjust` est fourni, affiche un ajusteur sobre (montant + dégât/soin) câblé serveur.
 * Sous 25 % → l'arc et le chiffre passent au rouge (--hp) comme signal d'alerte.
 */
interface VitalGaugeProps {
  label: string;
  value: number;
  max: number;
  /** Couleur de l'arc (var token, ex "var(--gauge-sante)"). */
  color: string;
  trackColor?: string;
  size?: number;
  strokeWidth?: number;
  /** Pas initial de l'ajusteur. */
  step?: number;
  /** Badge optionnel sous le label (ex palier de Flux "P2"). */
  badge?: string;
  /** Câblage serveur. delta négatif = dégât, positif = soin. */
  onAdjust?: (delta: number) => Promise<void>;
}

export function VitalGauge({
  label,
  value,
  max,
  color,
  trackColor = "var(--gauge-track)",
  size = 120,
  strokeWidth = 5,
  step = 5,
  badge,
  onAdjust,
}: VitalGaugeProps) {
  const [amount, setAmount] = useState(step);
  const [isPending, startTransition] = useTransition();
  // Valeur optimiste : snappe immédiatement au clic, réconciliée à la confirmation serveur.
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => setDisplayValue(value), [value]);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapAngle = 60; // degrés réservés en bas
  const arcFraction = (360 - gapAngle) / 360;
  const dashTotal = circumference * arcFraction;
  const ratio = max > 0 ? Math.max(0, Math.min(displayValue / max, 1)) : 0;
  const dashFill = dashTotal * ratio;
  const dashGap = dashTotal - dashFill;
  const rotationDeg = 90 + gapAngle / 2;
  const cx = size / 2;
  const cy = size / 2;
  const pct = max > 0 ? Math.round((displayValue / max) * 100) : 0;
  const isLow = pct < 25 && displayValue > 0;
  const isEmpty = displayValue <= 0;
  // Signal d'alerte : rouge sous le seuil critique, sinon teinte de jauge.
  const accentColor = isLow ? "var(--hp)" : color;

  const clampAmount = (n: number) =>
    !Number.isFinite(n) ? 1 : Math.max(1, Math.min(999, Math.round(n)));

  const adjust = (delta: number) => {
    if (!onAdjust) return;
    // Snap optimiste immédiat (la valeur bouge avant le retour serveur).
    setDisplayValue((v) => Math.max(0, Math.min(max, v + delta)));
    startTransition(async () => {
      await onAdjust(delta);
    });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Anneau */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="block"
          style={{ transform: `rotate(${rotationDeg}deg)` }}
          aria-hidden="true"
        >
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashTotal} ${circumference - dashTotal}`}
            strokeLinecap="round"
          />
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={isEmpty ? trackColor : accentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashFill} ${dashGap + (circumference - dashTotal)}`}
            strokeLinecap="round"
            style={{
              transition: "stroke-dasharray 0.5s cubic-bezier(.4,0,.2,1)",
            }}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ top: 4 }}
        >
          <CountUp
            value={displayValue}
            className="font-mono text-xl font-semibold leading-none tracking-tight tabular-nums slashed-zero"
            style={{
              color: isLow ? "var(--hp)" : isEmpty ? color : "var(--foreground)",
            }}
          />
          <span className="text-foreground-subtle mt-0.5 font-mono text-[10px] tracking-widest tabular-nums slashed-zero">
            /{max}
          </span>
        </div>
      </div>

      {/* Label + slot badge (hauteur réservée pour aligner les colonnes) */}
      <div className="flex h-7 flex-col items-center justify-start gap-0.5">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-muted">
          {label}
        </span>
        <span className="text-foreground-subtle font-mono text-[10px] tracking-widest tabular-nums">
          {badge || " "}
        </span>
      </div>

      {/* Ajusteur sobre — câblé serveur (dégât / soin avec montant) */}
      {onAdjust && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => adjust(-amount)}
            disabled={isPending}
            className="text-foreground-muted hover:bg-surface-overlay hover:text-foreground flex h-6 w-6 items-center justify-center rounded border border-border transition-colors disabled:opacity-40"
            aria-label={`Infliger ${amount} à ${label}`}
            title={`Dégât −${amount}`}
          >
            <Minus size={11} />
          </button>
          <input
            type="number"
            min={1}
            max={999}
            value={amount}
            onChange={(e) =>
              setAmount(clampAmount(parseInt(e.target.value || "0", 10)))
            }
            onFocus={(e) => e.currentTarget.select()}
            disabled={isPending}
            aria-label={`Montant pour ${label}`}
            className="border-border bg-surface-overlay text-foreground-muted focus:border-border-strong h-6 w-10 rounded border text-center font-mono text-[11px] tabular-nums slashed-zero outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            onClick={() => adjust(amount)}
            disabled={isPending}
            className="text-foreground-muted hover:bg-surface-overlay hover:text-foreground flex h-6 w-6 items-center justify-center rounded border border-border transition-colors disabled:opacity-40"
            aria-label={`Soigner ${amount} de ${label}`}
            title={`Soin +${amount}`}
          >
            <Plus size={11} />
          </button>
        </div>
      )}

      {/* Liseré pourcentage */}
      <div className="bg-surface-overlay h-px w-16 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: accentColor,
            opacity: 0.5,
            transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
    </div>
  );
}
