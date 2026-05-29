"use client";

import { useState, useTransition } from "react";
import {
  XP_THRESHOLDS,
  calculateLevel,
  getEnduranceTier,
  getLevelBonus,
  nextEnduranceTier,
  nextLevelXp,
} from "@/lib/faith-system";
import { AscensionGlyph } from "@/components/glyphs";
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
  onTrainingChange?: (delta: 1 | -1) => Promise<void>;
};

export function EvolutionSection({
  character,
  onXpChange,
  onTrainingChange,
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

  const tier = getEnduranceTier(character.enduranceTrainings);
  const nextTier = nextEnduranceTier(character.enduranceTrainings);

  function commitXp() {
    if (!onXpChange) return;
    const parsed = Math.max(0, Math.floor(Number(xpDraft) || 0));
    if (parsed === character.xp) return;
    startTransition(async () => {
      await onXpChange(parsed);
    });
  }

  function adjustTrainings(delta: 1 | -1) {
    if (!onTrainingChange) return;
    if (delta === -1 && character.enduranceTrainings <= 0) return;
    startTransition(async () => {
      await onTrainingChange(delta);
    });
  }

  return (
    <Card className="relative">
      <div className="pointer-events-none absolute right-4 top-4 text-ink-tertiary">
        <AscensionGlyph size={56} />
      </div>

      <CardHeader>
        <div className="flex items-baseline gap-2">
          <CardTitle className="text-sm">Évolution</CardTitle>
          <span className="text-xs text-muted-foreground">(privé MJ)</span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* XP / Niveau */}
          <div className="flex flex-col gap-3 border-b border-border pb-5 md:border-b-0 md:border-r md:pb-0 md:pr-6">
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
                  Niveau
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="big-number text-primary">{level}</span>
                  <span className="tabular text-sm text-muted-foreground">
                    bonus +{bonus}
                  </span>
                </div>
              </div>
              <div className="flex w-28 flex-col gap-1.5">
                <Label
                  htmlFor="evo-xp"
                  className="text-xs uppercase tracking-[0.06em] text-muted-foreground"
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
                  <span className="tabular text-primary">
                    {Math.max(0, nextXp - character.xp)}
                  </span>{" "}
                  XP pour Niv. {level + 1}
                </>
              )}
            </p>
          </div>

          {/* Endurance / Entraînements */}
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
                  Palier endurance
                </span>
                <Badge variant="outline" className="text-endu">
                  {tier.label}
                </Badge>
                <span className="tabular text-xs text-muted-foreground">
                  max {character.maxEndurance}
                </span>
              </div>
              <div className="flex w-28 flex-col gap-1.5">
                <span className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
                  Entraînements
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={
                      isPending ||
                      !onTrainingChange ||
                      character.enduranceTrainings <= 0
                    }
                    onClick={() => adjustTrainings(-1)}
                    aria-label="Retirer un entraînement"
                  >
                    −
                  </Button>
                  <span className="tabular flex-1 rounded-md border border-border bg-background px-2 py-1 text-center text-sm font-semibold text-foreground">
                    {character.enduranceTrainings}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={isPending || !onTrainingChange}
                    onClick={() => adjustTrainings(1)}
                    aria-label="Ajouter un entraînement"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <Separator className="md:hidden" />
            <p className="text-xs text-muted-foreground">
              {nextTier ? (
                <>
                  <span className="tabular">
                    {character.enduranceTrainings}
                  </span>{" "}
                  entraînement(s) — encore{" "}
                  <span className="tabular text-primary">
                    {nextTier.trainings - character.enduranceTrainings}
                  </span>{" "}
                  pour {nextTier.label} (
                  <span className="tabular">{nextTier.max}</span>)
                </>
              ) : (
                <>
                  Palier max (
                  <span className="tabular">
                    {character.enduranceTrainings}
                  </span>{" "}
                  entraînements)
                </>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
