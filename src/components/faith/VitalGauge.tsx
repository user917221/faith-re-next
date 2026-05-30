"use client";

import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { CountUp } from "./CountUp";

/**
 * Jauge vitale circulaire — arc avec gap bas (compteur sobre, design v0).
 * CONTRÔLÉE : la valeur affichée vient toujours des props (source de vérité serveur).
 * Si `onAdjust` est fourni, affiche un ajusteur sobre (montant + dégât/soin) câblé serveur.
 * Sans `onAdjust`, la jauge est en lecture seule (aperçu / vue MJ d'un autre joueur).
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
  /** Badge optionnel sous le label (ex palier de Flux "Palier 2"). */
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
  strokeWidth = 7,
  step = 5,
  badge,
  onAdjust,
}: VitalGaugeProps) {
  const [amount, setAmount] = useState(step);
  const [isPending, startTransition] = useTransition();

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapAngle = 60; // degrés réservés en bas
  const arcFraction = (360 - gapAngle) / 360;
  const dashTotal = circumference * arcFraction;
  const ratio = max > 0 ? Math.max(0, Math.min(value / max, 1)) : 0;
  const dashFill = dashTotal * ratio;
  const dashGap = dashTotal - dashFill;
  const rotationDeg = 90 + gapAngle / 2;
  const cx = size / 2;
  const cy = size / 2;
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const isLow = pct < 25 && value > 0;
  const isEmpty = value <= 0;

  const clampAmount = (n: number) =>
    !Number.isFinite(n) ? 1 : Math.max(1, Math.min(999, Math.round(n)));

  const adjust = (delta: number) => {
    if (!onAdjust) return;
    startTransition(async () => {
      await onAdjust(delta);
    });
  };

  return (
    <div className="flex flex-col items-center gap-2.5">
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
            stroke={isEmpty ? trackColor : color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashFill} ${dashGap + (circumference - dashTotal)}`}
            strokeLinecap="round"
            style={{
              transition: "stroke-dasharray 0.5s cubic-bezier(.4,0,.2,1)",
              opacity: isPending ? 0.6 : 1,
            }}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ top: 4 }}
        >
          <CountUp
            value={value}
            className="font-mono text-xl font-semibold leading-none tracking-tight tabular-nums slashed-zero"
            style={{ color: isLow || isEmpty ? color : "var(--foreground)" }}
          />
          <span className="text-foreground-subtle mt-0.5 font-mono text-[10px] tracking-widest tabular-nums slashed-zero">
            /{max}
          </span>
        </div>
      </div>

      {/* Label + badge */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-foreground-muted text-xs font-medium uppercase tracking-widest">
          {label}
        </span>
        {badge && (
          <span className="text-foreground-subtle font-mono text-[10px] tracking-widest">
            {badge}
          </span>
        )}
      </div>

      {/* Ajusteur sobre — câblé serveur (dégât / soin avec montant) */}
      {onAdjust && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => adjust(-amount)}
            disabled={isPending}
            className="text-foreground-subtle hover:bg-surface-overlay hover:text-foreground-muted flex h-6 w-6 items-center justify-center rounded transition-colors disabled:opacity-40"
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
            className="border-border bg-surface-overlay text-foreground-muted focus:border-border-strong h-6 w-10 rounded border text-center font-mono text-[11px] tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            onClick={() => adjust(amount)}
            disabled={isPending}
            className="text-foreground-subtle hover:bg-surface-overlay hover:text-foreground-muted flex h-6 w-6 items-center justify-center rounded transition-colors disabled:opacity-40"
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
            backgroundColor: color,
            opacity: 0.5,
            transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
    </div>
  );
}
