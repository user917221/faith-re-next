"use client";

/**
 * Campaign Status — bloc de pied de sidebar (cockpit MJ).
 * Phase 5 : valeurs réelles (table `campaign`). Si les callbacks d'édition
 * sont fournis (MJ), les jauges/compteurs deviennent interactifs ; sinon
 * lecture seule (aperçu /cockpit).
 */
import { Minus, Plus } from "lucide-react";

type Props = {
  threatLevel?: number; // 0..5
  morale?: number; // 0..5
  questsActive?: number;
  downtimeDays?: number;
  onThreatChange?: (value: number) => void;
  onMoraleChange?: (value: number) => void;
  onQuestsChange?: (delta: number) => void;
  onDowntimeChange?: (delta: number) => void;
};

const THREAT_LABEL = ["Calme", "Faible", "Modérée", "Notable", "Élevée", "Critique"];
const MORALE_LABEL = ["À terre", "Fragile", "Tendu", "Stable", "Bon", "Au sommet"];

function Meter({
  value,
  max = 5,
  tone,
  onSet,
}: {
  value: number;
  max?: number;
  tone: string;
  onSet?: (value: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value;
        const seg = (
          <span
            className="h-1 w-full rounded-full transition-colors"
            style={{ backgroundColor: filled ? tone : "rgba(255,255,255,0.08)" }}
          />
        );
        return onSet ? (
          <button
            key={i}
            type="button"
            // Clic sur le segment courant le plus haut → décrémente ; sinon set i+1.
            onClick={() => onSet(value === i + 1 ? i : i + 1)}
            className="flex h-3 flex-1 items-center"
            aria-label={`Régler à ${i + 1}`}
          >
            {seg}
          </button>
        ) : (
          <span key={i} className="flex-1">
            {seg}
          </span>
        );
      })}
    </div>
  );
}

function Stepper({
  onDelta,
  label,
}: {
  onDelta: (d: number) => void;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        aria-label={`${label} −1`}
        onClick={() => onDelta(-1)}
        className="flex size-4 items-center justify-center rounded border border-border text-foreground-subtle transition-colors hover:text-foreground"
      >
        <Minus size={9} />
      </button>
      <button
        type="button"
        aria-label={`${label} +1`}
        onClick={() => onDelta(1)}
        className="flex size-4 items-center justify-center rounded border border-border text-foreground-subtle transition-colors hover:text-foreground"
      >
        <Plus size={9} />
      </button>
    </span>
  );
}

export function CampaignStatus({
  threatLevel = 4,
  morale = 3,
  questsActive = 5,
  downtimeDays = 2,
  onThreatChange,
  onMoraleChange,
  onQuestsChange,
  onDowntimeChange,
}: Props) {
  return (
    <div className="campaign-subpanel flex flex-col gap-2.5 p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-foreground-subtle">
        Statut de campagne
      </p>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-foreground-muted">Menace</span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-hp">
            {THREAT_LABEL[Math.min(5, Math.max(0, threatLevel))]}
          </span>
        </div>
        <Meter value={threatLevel} tone="var(--hp)" onSet={onThreatChange} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-foreground-muted">Moral</span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-endu">
            {MORALE_LABEL[Math.min(5, Math.max(0, morale))]}
          </span>
        </div>
        <Meter value={morale} tone="var(--endu)" onSet={onMoraleChange} />
      </div>
      <div className="mt-0.5 flex items-center justify-between border-t border-border pt-2 text-[11px]">
        <span className="text-foreground-muted">Quêtes</span>
        <span className="flex items-center gap-2">
          <span className="font-mono tabular-nums slashed-zero text-foreground">
            {questsActive}
          </span>
          {onQuestsChange && <Stepper onDelta={onQuestsChange} label="Quêtes" />}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-foreground-muted">Repos</span>
        <span className="flex items-center gap-2">
          <span className="font-mono tabular-nums slashed-zero text-foreground-muted">
            {downtimeDays} {downtimeDays > 1 ? "jours" : "jour"}
          </span>
          {onDowntimeChange && (
            <Stepper onDelta={onDowntimeChange} label="Repos" />
          )}
        </span>
      </div>
    </div>
  );
}
