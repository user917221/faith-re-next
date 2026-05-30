"use client";

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
  return (
    <section
      className="campaign-panel p-5"
      aria-label="Jauges de vitalité"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
          État vital
        </h2>
        <span
          className={`rounded-md border px-2 py-0.5 font-mono text-[10px] ${
            character.isPresent
              ? "border-primary/25 bg-primary/10 text-primary"
              : "border-border/60 text-foreground-subtle/60"
          }`}
        >
          {character.isPresent ? "Actif" : "Hors table"}
        </span>
      </div>

      <div className="grid grid-cols-2 items-start justify-items-center gap-6 sm:grid-cols-4 sm:gap-5">
        <VitalGauge
          label="Santé"
          value={character.currentHp}
          max={character.maxHp}
          color="var(--gauge-sante)"
          step={5}
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
