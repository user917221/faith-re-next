"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CountUp } from "./CountUp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  /** Montant fixe d'armure soustrait des dégâts (réduit un delta négatif). */
  armorReduction?: number;
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
  armorReduction = 0,
  onAdjust,
}: VitalGaugeProps) {
  const [amount, setAmount] = useState(step);
  const [isPending, startTransition] = useTransition();
  // Valeur optimiste : snappe immédiatement au clic, réconciliée à la confirmation serveur.
  const displayValue = value;

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
    // Si dégât (delta < 0), l'armure réduit l'amplitude (sans jamais devenir un soin).
    const actualDelta =
      delta < 0 ? Math.min(0, delta + (armorReduction ?? 0)) : delta;
    // La valeur affichée vient du serveur (source de vérité) ; en cas d'échec
    // de la server action, on signale l'erreur — sinon l'ajustement échoue en
    // silence et l'utilisateur croit le coup porté.
    startTransition(async () => {
      try {
        await onAdjust(actualDelta);
      } catch (e) {
        toast.error(
          `Ajustement de ${label} impossible`,
          { description: e instanceof Error ? e.message : undefined },
        );
      }
    });
  };

  return (
    <div className="campaign-subpanel flex w-full max-w-[10rem] flex-col items-center gap-2 p-3 transition-opacity duration-300">
      {/* Anneau */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className={cn("block", isPending && "animate-pulse")}
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
            className={cn(isPending && "transition-none")}
            style={{
              transition: "stroke-dasharray 0.5s cubic-bezier(.4,0,.2,1)",
            }}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ top: 4 }}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Libellé lisible pour les lecteurs d'écran (ex. « Santé : 125 sur 220 »).
              Le visuel est masqué de l'AT pour ne pas annoncer les chiffres animés. */}
          <span className="sr-only">
            {label} : {displayValue} sur {max}
          </span>
          <span aria-hidden="true" className="contents">
            <CountUp
              value={displayValue}
              className="font-mono text-2xl font-semibold leading-none tabular-nums slashed-zero"
              style={{
                // PV négatifs (système de mort, jusqu'à -21) → bleu, signal distinct.
                color:
                  displayValue < 0
                    ? "var(--mhp)"
                    : isLow
                      ? "var(--hp)"
                      : isEmpty
                        ? color
                        : "var(--foreground)",
              }}
            />
          </span>
          {isPending ? (
            <Loader2 className="mt-1 size-3 animate-spin text-primary" aria-hidden="true" />
          ) : (
            <span
              aria-hidden="true"
              className="text-foreground-subtle mt-0.5 font-mono text-[10px] tracking-[0.14em] tabular-nums slashed-zero"
            >
              /{max}
            </span>
          )}
        </div>
      </div>

      {/* Label + slot badge (hauteur réservée pour aligner les colonnes) */}
      <div className="flex h-7 flex-col items-center justify-start gap-0.5">
        <span className="eyebrow">{label}</span>
        <span className="text-foreground-subtle font-mono text-[10px] tracking-widest tabular-nums">
          {badge || " "}
        </span>
      </div>

      {/* Ajusteur sobre — câblé serveur (dégât / soin avec montant) */}
      {/* Cibles tactiles ≥ 36px sur mobile, taille desktop (24px) restaurée en sm. */}
      {onAdjust && (
        <div className="flex items-center gap-2 sm:gap-1.5">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => adjust(-amount)}
            disabled={isPending}
            className="size-9 text-foreground-muted hover:text-foreground sm:size-6"
            aria-label={`Infliger ${amount} à ${label}`}
            title={`Dégât −${amount}`}
          >
            <Minus className="size-3" />
          </Button>
          <Input
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
            className="h-9 w-12 bg-background/50 text-center font-mono text-[11px] tabular-nums slashed-zero text-foreground-muted outline-none [appearance:textfield] focus-visible:border-primary/40 focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:h-6 sm:w-11"
          />
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => adjust(amount)}
            disabled={isPending}
            className="size-9 text-foreground-muted hover:text-foreground sm:size-6"
            aria-label={`Soigner ${amount} de ${label}`}
            title={`Soin +${amount}`}
          >
            <Plus className="size-3" />
          </Button>
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
