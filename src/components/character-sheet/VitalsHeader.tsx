"use client";

import { HeartCrack } from "lucide-react";
import { getVitalityState } from "@/lib/faith-system";
import type { Character, VitalType } from "./types";
import { VitalGauge } from "@/components/faith/VitalGauge";

type Props = {
  character: Character;
  onVitalChange?: (type: VitalType, delta: number) => Promise<void>;
  onFluxChange?: (delta: number) => Promise<void>;
};

/**
 * En-tête vital — 4 jauges circulaires sobres (Santé / Mental / Endurance / Flux)
 * dans la dalle de verre « État vital » (direction v0 validée).
 * Les jauges sont CONTRÔLÉES par les vraies données et câblées aux server actions
 * via `onVitalChange` / `onFluxChange`.
 */
export function VitalsHeader({ character, onVitalChange, onFluxChange }: Props) {
  const vitality = getVitalityState(character.currentHp);
  return (
    <section
      className="campaign-panel p-5"
      aria-label="Jauges de vitalité"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="eyebrow">État vital</h2>
        <span
          className={`rounded-md border px-2 py-0.5 font-mono text-[10px] ${
            character.isPresent
              ? "border-primary/25 bg-primary/10 text-primary-hover"
              : "border-border/60 text-foreground-subtle"
          }`}
        >
          {character.isPresent ? "Actif" : "Hors table"}
        </span>
      </div>

      {vitality.key !== "vivant" && (
        <div
          className="mb-4 flex flex-col gap-0.5 rounded-md border px-3 py-2"
          style={{
            borderColor: "color-mix(in oklab, var(--hp) 45%, transparent)",
            background: "color-mix(in oklab, var(--hp) 12%, transparent)",
          }}
          role="status"
          aria-live="assertive"
        >
          <span
            className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--hp)" }}
          >
            <HeartCrack size={13} aria-hidden />
            {vitality.label}
            <span className="ml-auto font-mono text-[10px] tabular-nums opacity-80">
              {character.currentHp} PV
            </span>
          </span>
          {vitality.effect && (
            <span className="text-[11px] leading-snug text-foreground-muted">
              {vitality.effect}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 items-start justify-items-center gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-5">
        <VitalGauge
          label="Santé"
          value={character.currentHp}
          max={character.maxHp}
          color="var(--gauge-sante)"
          step={5}
          armorReduction={character.armor}
          onAdjust={
            onVitalChange ? (d) => onVitalChange("hp", d) : undefined
          }
        />
        <VitalGauge
          label="Mental"
          value={character.currentMental}
          max={character.maxMental}
          color="var(--gauge-mental)"
          step={5}
          onAdjust={
            onVitalChange ? (d) => onVitalChange("mental", d) : undefined
          }
        />
        <VitalGauge
          label="Endurance"
          value={character.currentEndurance}
          max={character.maxEndurance}
          color="var(--gauge-endurance)"
          step={10}
          onAdjust={
            onVitalChange ? (d) => onVitalChange("endu", d) : undefined
          }
        />
        <VitalGauge
          label="Flux"
          value={character.currentFlux}
          max={character.maxFlux}
          color="var(--gauge-flux)"
          step={10}
          badge={character.fluxLabel}
          onAdjust={onFluxChange}
        />
      </div>
    </section>
  );
}
