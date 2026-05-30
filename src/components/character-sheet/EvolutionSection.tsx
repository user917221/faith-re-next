"use client";

import { useState, useTransition } from "react";
import {
  FLUX_TIERS,
  TECHNICAL_TIERS,
  XP_THRESHOLDS,
  calculateLevel,
  getEnduranceTier,
  getFluxTier,
  getLevelBonus,
  getTechnicalTier,
  nextEnduranceTier,
  nextFluxTier,
  nextLevelXp,
} from "@/lib/faith-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Character } from "./types";

type Props = {
  character: Character;
  onXpChange?: (newXp: number) => Promise<void>;
  onTrainingChange?: (delta: 1 | -1) => Promise<void>; // endurance (physique)
  onFluxTrainingChange?: (delta: 1 | -1) => Promise<void>;
  onCombatChange?: (delta: 1 | -1) => Promise<void>;
  onTechnicalChange?: (delta: 1 | -1) => Promise<void>;
};

/** Chip pilule v0 — palier / label sobre. */
function TierChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-background/45 px-2 py-0.5 font-mono text-[11px] tabular-nums slashed-zero text-foreground-muted">
      {children}
    </span>
  );
}

/** Prochain palier technique non atteint (mirror de nextEnduranceTier). */
function nextTechnicalTier(trainings: number) {
  const ascending = [...TECHNICAL_TIERS].reverse();
  for (const tier of ascending) {
    if (tier.trainings > (trainings ?? 0)) return tier;
  }
  return null;
}

/** Compteur −/+ générique, calé sur le pattern « Entraînements » existant. */
function StepperCounter({
  value,
  onStep,
  disabled,
  minLabel,
  plusLabel,
}: {
  value: number;
  onStep: (delta: 1 | -1) => void;
  disabled: boolean;
  minLabel: string;
  plusLabel: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={disabled || value <= 0}
        onClick={() => onStep(-1)}
        aria-label={minLabel}
      >
        −
      </Button>
      <span className="flex-1 rounded-md border border-border bg-background/45 px-2 py-1 text-center font-mono tabular-nums slashed-zero text-foreground">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={disabled}
        onClick={() => onStep(1)}
        aria-label={plusLabel}
      >
        +
      </Button>
    </div>
  );
}

export function EvolutionSection({
  character,
  onXpChange,
  onTrainingChange,
  onFluxTrainingChange,
  onCombatChange,
  onTechnicalChange,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [xpDraft, setXpDraft] = useState<string>(String(character.xp));

  const level = calculateLevel(character.xp);
  const bonus = getLevelBonus(level);
  const nextXp = nextLevelXp(level);
  const isMaxLevel = level >= XP_THRESHOLDS.length - 1;
  const xpProgress = isMaxLevel
    ? 100
    : Math.min(
        100,
        Math.round(
          ((character.xp - XP_THRESHOLDS[level]) /
            (nextXp - XP_THRESHOLDS[level])) *
            100,
        ),
      );

  // Endurance (axe physique)
  const enduTier = getEnduranceTier(character.enduranceTrainings);
  const nextEndu = nextEnduranceTier(character.enduranceTrainings);

  // Technique
  const techTier = getTechnicalTier(character.technicalTrainings);
  const nextTech = nextTechnicalTier(character.technicalTrainings);

  // Flux — palier dérivé des DEUX conditions (entraînements + combats)
  const fluxTier = getFluxTier(character.fluxTrainings, character.combatsReal);
  const nextFlux = nextFluxTier(character.fluxTrainings, character.combatsReal);
  const maxFluxPalier = FLUX_TIERS[0].palier;
  const isFluxMax = fluxTier.palier >= maxFluxPalier;
  const fluxTrainingsNeeded = nextFlux
    ? Math.max(0, nextFlux.fluxTrainings - character.fluxTrainings)
    : 0;
  const combatsNeeded = nextFlux
    ? Math.max(0, nextFlux.combats - character.combatsReal)
    : 0;

  function commitXp() {
    if (!onXpChange) return;
    const parsed = Math.max(0, Math.floor(Number(xpDraft) || 0));
    if (parsed === character.xp) return;
    startTransition(async () => {
      await onXpChange(parsed);
    });
  }

  function makeStepper(
    handler: ((delta: 1 | -1) => Promise<void>) | undefined,
    current: number,
  ) {
    return (delta: 1 | -1) => {
      if (!handler) return;
      if (delta === -1 && current <= 0) return;
      startTransition(async () => {
        await handler(delta);
      });
    };
  }

  const stepEndurance = makeStepper(
    onTrainingChange,
    character.enduranceTrainings,
  );
  const stepFlux = makeStepper(onFluxTrainingChange, character.fluxTrainings);
  const stepTechnical = makeStepper(
    onTechnicalChange,
    character.technicalTrainings,
  );
  const stepCombat = makeStepper(onCombatChange, character.combatsReal);

  return (
    <section
      className="campaign-panel"
    >
      <div className="campaign-header-line flex items-center justify-between px-5 py-3.5">
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
          Évolution
        </h2>
        <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-primary">
          privé MJ
        </span>
      </div>

      <div className="flex flex-col gap-6 p-5">
        {/* ─── XP / Niveau / Tier global ─── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
                Niveau
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono tabular-nums slashed-zero text-2xl font-medium text-foreground">
                  {level}
                </span>
                <TierChip>{character.tier}</TierChip>
                <span className="font-mono tabular-nums slashed-zero text-sm text-foreground-muted">
                  bonus +{bonus}
                </span>
              </div>
            </div>
            <div className="flex w-28 flex-col gap-1.5">
              <Label
                htmlFor="evo-xp"
                className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle"
              >
                XP total
              </Label>
              <Input
                id="evo-xp"
                type="number"
                min={0}
                step={50}
                value={xpDraft}
                disabled={isPending || !onXpChange}
                onChange={(e) => setXpDraft(e.target.value)}
                onBlur={commitXp}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="text-right font-mono tabular-nums slashed-zero"
              />
            </div>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-overlay">
            <div
              className="h-full rounded-full"
              style={{
                width: `${xpProgress}%`,
                backgroundColor: "var(--primary)",
                transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </div>
          <p className="text-xs text-foreground-muted">
            {isMaxLevel ? (
              <>
                Niveau max (
                <span className="font-mono tabular-nums slashed-zero">
                  {character.xp}
                </span>{" "}
                XP)
              </>
            ) : (
              <>
                <span className="font-mono tabular-nums slashed-zero">
                  {character.xp}
                </span>{" "}
                /{" "}
                <span className="font-mono tabular-nums slashed-zero">
                  {nextXp}
                </span>{" "}
                — encore{" "}
                <span className="font-mono tabular-nums slashed-zero font-medium text-foreground">
                  {Math.max(0, nextXp - character.xp)}
                </span>{" "}
                XP pour Niv. {level + 1}
              </>
            )}
          </p>
        </div>

        <div className="border-t border-border" />

        {/* ─── Entraînements — un bloc par axe ─── */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
            Entraînements
          </span>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Physique (= endurance) */}
            <div className="campaign-subpanel flex flex-col gap-2.5 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium tracking-tight text-foreground">
                  Physique
                </span>
                <TierChip>{enduTier.label}</TierChip>
              </div>
              <StepperCounter
                value={character.enduranceTrainings}
                onStep={stepEndurance}
                disabled={isPending || !onTrainingChange}
                minLabel="Retirer un entraînement physique"
                plusLabel="Ajouter un entraînement physique"
              />
              <p className="text-xs text-foreground-muted">
                Endurance max{" "}
                <span className="font-mono tabular-nums slashed-zero font-medium text-foreground">
                  {character.maxEndurance}
                </span>
                {nextEndu ? (
                  <>
                    {" "}
                    — encore{" "}
                    <span className="font-mono tabular-nums slashed-zero font-medium text-foreground">
                      {Math.max(
                        0,
                        nextEndu.trainings - character.enduranceTrainings,
                      )}
                    </span>{" "}
                    pour {nextEndu.label} (
                    <span className="font-mono tabular-nums slashed-zero">
                      {nextEndu.max}
                    </span>
                    )
                  </>
                ) : (
                  <> — palier max</>
                )}
              </p>
            </div>

            {/* Flux */}
            <div className="campaign-subpanel flex flex-col gap-2.5 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium tracking-tight text-foreground">
                  Flux
                </span>
                <TierChip>{fluxTier.label}</TierChip>
              </div>
              <StepperCounter
                value={character.fluxTrainings}
                onStep={stepFlux}
                disabled={isPending || !onFluxTrainingChange}
                minLabel="Retirer un entraînement de Flux"
                plusLabel="Ajouter un entraînement de Flux"
              />
              <p className="text-xs text-foreground-muted">
                {nextFlux ? (
                  <>
                    Vers {nextFlux.label} :{" "}
                    <span className="font-mono tabular-nums slashed-zero font-medium text-foreground">
                      {character.fluxTrainings}
                    </span>
                    /
                    <span className="font-mono tabular-nums slashed-zero">
                      {nextFlux.fluxTrainings}
                    </span>{" "}
                    entraîn.
                    {fluxTrainingsNeeded > 0 ? (
                      <>
                        {" "}
                        (encore{" "}
                        <span className="font-mono tabular-nums slashed-zero font-medium text-foreground">
                          {fluxTrainingsNeeded}
                        </span>
                        )
                      </>
                    ) : (
                      <> ✓</>
                    )}
                  </>
                ) : (
                  <>
                    Condition Flux remplie au palier max (
                    <span className="font-mono tabular-nums slashed-zero">
                      {character.fluxTrainings}
                    </span>{" "}
                    entraîn.)
                  </>
                )}
              </p>
            </div>

            {/* Technique */}
            <div className="campaign-subpanel flex flex-col gap-2.5 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium tracking-tight text-foreground">
                  Technique
                </span>
                <TierChip>
                  {character.technicalLabel || techTier.label}
                </TierChip>
              </div>
              <StepperCounter
                value={character.technicalTrainings}
                onStep={stepTechnical}
                disabled={isPending || !onTechnicalChange}
                minLabel="Retirer un entraînement technique"
                plusLabel="Ajouter un entraînement technique"
              />
              <p className="text-xs text-foreground-muted">
                {nextTech ? (
                  <>
                    <span className="font-mono tabular-nums slashed-zero font-medium text-foreground">
                      {character.technicalTrainings}
                    </span>{" "}
                    entraîn. — encore{" "}
                    <span className="font-mono tabular-nums slashed-zero font-medium text-foreground">
                      {Math.max(
                        0,
                        nextTech.trainings - character.technicalTrainings,
                      )}
                    </span>{" "}
                    pour {nextTech.label}
                  </>
                ) : (
                  <>
                    Palier max (
                    <span className="font-mono tabular-nums slashed-zero">
                      {character.technicalTrainings}
                    </span>{" "}
                    entraîn.)
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* ─── Combats réels + Palier de Flux (level-up MJ) ─── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Combats réels */}
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
              Combats réels
            </span>
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-mono tabular-nums slashed-zero text-2xl font-medium text-foreground">
                  {character.combatsReal}
                </span>
                <span className="text-xs text-foreground-muted">
                  combats menés
                </span>
              </div>
              <div className="w-28">
                <StepperCounter
                  value={character.combatsReal}
                  onStep={stepCombat}
                  disabled={isPending || !onCombatChange}
                  minLabel="Retirer un combat réel"
                  plusLabel="Ajouter un combat réel"
                />
              </div>
            </div>
            <p className="text-xs text-foreground-muted">
              {nextFlux ? (
                <>
                  Vers {nextFlux.label} :{" "}
                  <span className="font-mono tabular-nums slashed-zero font-medium text-foreground">
                    {character.combatsReal}
                  </span>
                  /
                  <span className="font-mono tabular-nums slashed-zero">
                    {nextFlux.combats}
                  </span>{" "}
                  combats
                  {combatsNeeded > 0 ? (
                    <>
                      {" "}
                      (encore{" "}
                      <span className="font-mono tabular-nums slashed-zero font-medium text-foreground">
                        {combatsNeeded}
                      </span>
                      )
                    </>
                  ) : (
                    <> ✓</>
                  )}
                </>
              ) : (
                <>
                  Condition combats remplie au palier max (
                  <span className="font-mono tabular-nums slashed-zero">
                    {character.combatsReal}
                  </span>
                  )
                </>
              )}
            </p>
          </div>

          {/* Palier de Flux — le « level up » que le MJ doit voir */}
          <div className="campaign-subpanel flex flex-col gap-2.5 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
                Palier de Flux
              </span>
              <TierChip>{character.fluxLabel || fluxTier.label}</TierChip>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-foreground-muted">jauge max</span>
              <span className="font-mono tabular-nums slashed-zero text-lg font-semibold text-foreground">
                {character.maxFlux}
              </span>
            </div>
            <div className="border-t border-border" />
            {isFluxMax || !nextFlux ? (
              <p className="text-xs text-foreground-muted">
                Palier de Flux maximal atteint.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-foreground-muted">
                  Prochain seuil —{" "}
                  <span className="font-medium text-foreground">
                    {nextFlux.label}
                  </span>{" "}
                  (jauge{" "}
                  <span className="font-mono tabular-nums slashed-zero">
                    {nextFlux.max}
                  </span>
                  )
                </p>
                <p className="text-xs text-foreground-muted">
                  Requiert{" "}
                  <span className="font-mono tabular-nums slashed-zero font-medium text-foreground">
                    {nextFlux.fluxTrainings}
                  </span>{" "}
                  entraîn. Flux +{" "}
                  <span className="font-mono tabular-nums slashed-zero font-medium text-foreground">
                    {nextFlux.combats}
                  </span>{" "}
                  combats.
                </p>
                <p className="text-xs text-foreground-subtle">
                  Manque{" "}
                  <span className="font-mono tabular-nums slashed-zero text-foreground-muted">
                    {fluxTrainingsNeeded}
                  </span>{" "}
                  entraîn. ·{" "}
                  <span className="font-mono tabular-nums slashed-zero text-foreground-muted">
                    {combatsNeeded}
                  </span>{" "}
                  combats.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
