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
import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { Character } from "./types";

type Props = {
  character: Character;
  onXpChange?: (newXp: number) => Promise<void>;
  onTrainingChange?: (delta: 1 | -1) => Promise<void>; // endurance (physique)
  onFluxTrainingChange?: (delta: 1 | -1) => Promise<void>;
  onCombatChange?: (delta: 1 | -1) => Promise<void>;
  onTechnicalChange?: (delta: 1 | -1) => Promise<void>;
};

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
      <span className="flex-1 rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-1 text-center font-mono text-sm font-semibold tabular-nums slashed-zero text-foreground">
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
    <Card className="relative border border-border ring-0">
      <CardHeader>
        <div className="flex items-baseline gap-2">
          <TrendingUp
            size={14}
            className="shrink-0 self-center text-foreground-subtle"
          />
          <CardTitle className="text-sm">Évolution</CardTitle>
          <span className="text-xs text-muted-foreground">(privé MJ)</span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* ─── XP / Niveau / Tier global ─── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-foreground-subtle">
                Niveau
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono tabular-nums slashed-zero text-2xl font-medium text-foreground">
                  {level}
                </span>
                <Badge variant="outline" className="tabular">
                  {character.tier}
                </Badge>
                <span className="tabular text-sm text-muted-foreground">
                  bonus +{bonus}
                </span>
              </div>
            </div>
            <div className="flex w-28 flex-col gap-1.5">
              <Label
                htmlFor="evo-xp"
                className="text-[10px] font-mono uppercase tracking-[0.14em] text-foreground-subtle"
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
                className="tabular text-right"
              />
            </div>
          </div>
          <Progress value={xpProgress} />
          <p className="text-xs text-muted-foreground">
            {isMaxLevel ? (
              <>
                Niveau max (<span className="tabular">{character.xp}</span> XP)
              </>
            ) : (
              <>
                <span className="tabular">{character.xp}</span> /{" "}
                <span className="tabular">{nextXp}</span> — encore{" "}
                <span className="tabular font-medium text-foreground">
                  {Math.max(0, nextXp - character.xp)}
                </span>{" "}
                XP pour Niv. {level + 1}
              </>
            )}
          </p>
        </div>

        <Separator />

        {/* ─── Entraînements — un bloc par axe ─── */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-foreground-subtle">
            Entraînements
          </span>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Physique (= endurance) */}
            <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface-overlay/50 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium tracking-tight text-foreground">
                  Physique
                </span>
                <Badge variant="outline" className="text-endu">
                  {enduTier.label}
                </Badge>
              </div>
              <StepperCounter
                value={character.enduranceTrainings}
                onStep={stepEndurance}
                disabled={isPending || !onTrainingChange}
                minLabel="Retirer un entraînement physique"
                plusLabel="Ajouter un entraînement physique"
              />
              <p className="text-xs text-muted-foreground">
                Endurance max{" "}
                <span className="tabular font-medium text-foreground">
                  {character.maxEndurance}
                </span>
                {nextEndu ? (
                  <>
                    {" "}
                    — encore{" "}
                    <span className="tabular font-medium text-foreground">
                      {Math.max(
                        0,
                        nextEndu.trainings - character.enduranceTrainings,
                      )}
                    </span>{" "}
                    pour {nextEndu.label} (
                    <span className="tabular">{nextEndu.max}</span>)
                  </>
                ) : (
                  <> — palier max</>
                )}
              </p>
            </div>

            {/* Flux */}
            <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface-overlay/50 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium tracking-tight text-foreground">
                  Flux
                </span>
                <Badge variant="outline" className="text-ink-muted">
                  {fluxTier.label}
                </Badge>
              </div>
              <StepperCounter
                value={character.fluxTrainings}
                onStep={stepFlux}
                disabled={isPending || !onFluxTrainingChange}
                minLabel="Retirer un entraînement de Flux"
                plusLabel="Ajouter un entraînement de Flux"
              />
              <p className="text-xs text-muted-foreground">
                {nextFlux ? (
                  <>
                    Vers {nextFlux.label} :{" "}
                    <span className="tabular font-medium text-foreground">
                      {character.fluxTrainings}
                    </span>
                    /<span className="tabular">{nextFlux.fluxTrainings}</span>{" "}
                    entraîn.
                    {fluxTrainingsNeeded > 0 ? (
                      <>
                        {" "}
                        (encore{" "}
                        <span className="tabular font-medium text-foreground">
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
                    <span className="tabular">{character.fluxTrainings}</span>{" "}
                    entraîn.)
                  </>
                )}
              </p>
            </div>

            {/* Technique */}
            <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface-overlay/50 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium tracking-tight text-foreground">
                  Technique
                </span>
                <Badge variant="outline" className="text-ink-muted">
                  {character.technicalLabel || techTier.label}
                </Badge>
              </div>
              <StepperCounter
                value={character.technicalTrainings}
                onStep={stepTechnical}
                disabled={isPending || !onTechnicalChange}
                minLabel="Retirer un entraînement technique"
                plusLabel="Ajouter un entraînement technique"
              />
              <p className="text-xs text-muted-foreground">
                {nextTech ? (
                  <>
                    <span className="tabular font-medium text-foreground">
                      {character.technicalTrainings}
                    </span>{" "}
                    entraîn. — encore{" "}
                    <span className="tabular font-medium text-foreground">
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
                    <span className="tabular">
                      {character.technicalTrainings}
                    </span>{" "}
                    entraîn.)
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* ─── Combats réels + Palier de Flux (level-up MJ) ─── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Combats réels */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-foreground-subtle">
              Combats réels
            </span>
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-mono tabular-nums slashed-zero text-2xl font-medium text-foreground">
                  {character.combatsReal}
                </span>
                <span className="text-xs text-muted-foreground">
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
            <p className="text-xs text-muted-foreground">
              {nextFlux ? (
                <>
                  Vers {nextFlux.label} :{" "}
                  <span className="tabular font-medium text-foreground">
                    {character.combatsReal}
                  </span>
                  /<span className="tabular">{nextFlux.combats}</span> combats
                  {combatsNeeded > 0 ? (
                    <>
                      {" "}
                      (encore{" "}
                      <span className="tabular font-medium text-foreground">
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
                  <span className="tabular">{character.combatsReal}</span>)
                </>
              )}
            </p>
          </div>

          {/* Palier de Flux — le « level up » que le MJ doit voir */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface-overlay/50 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-foreground-subtle">
                Palier de Flux
              </span>
              <Badge variant="outline" className="text-foreground">
                {character.fluxLabel || fluxTier.label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="tabular text-xs text-muted-foreground">
                jauge max
              </span>
              <span className="tabular text-lg font-semibold text-foreground">
                {character.maxFlux}
              </span>
            </div>
            <Separator />
            {isFluxMax || !nextFlux ? (
              <p className="text-xs text-muted-foreground">
                Palier de Flux maximal atteint.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">
                  Prochain seuil —{" "}
                  <span className="font-medium text-foreground">
                    {nextFlux.label}
                  </span>{" "}
                  (jauge <span className="tabular">{nextFlux.max}</span>)
                </p>
                <p className="text-xs text-muted-foreground">
                  Requiert{" "}
                  <span className="tabular font-medium text-foreground">
                    {nextFlux.fluxTrainings}
                  </span>{" "}
                  entraîn. Flux +{" "}
                  <span className="tabular font-medium text-foreground">
                    {nextFlux.combats}
                  </span>{" "}
                  combats.
                </p>
                <p className="text-xs text-ink-tertiary">
                  Manque{" "}
                  <span className="tabular text-muted-foreground">
                    {fluxTrainingsNeeded}
                  </span>{" "}
                  entraîn. ·{" "}
                  <span className="tabular text-muted-foreground">
                    {combatsNeeded}
                  </span>{" "}
                  combats.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
