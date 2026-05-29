"use client";

import { useState, useTransition } from "react";
import { CalvaryGlyph, EclipseGlyph } from "@/components/glyphs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RecoveryResult =
  | { kind: "hp"; gain: number; d1: number; d2: number; ecaille: number; newHp: number; maxHp: number }
  | { kind: "endu"; gain: number; roll: number; newEndurance: number; maxEndurance: number }
  | { kind: "error"; message: string };

type Props = {
  onRecoverHp?: () => Promise<{ gain: number; d1: number; d2: number; ecaille: number; newHp: number; maxHp: number }>;
  onRecoverEndurance?: () => Promise<{ gain: number; roll: number; newEndurance: number; maxEndurance: number }>;
};

export function RecoveryPanel({ onRecoverHp, onRecoverEndurance }: Props) {
  const [isPending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<RecoveryResult | null>(null);

  if (!onRecoverHp && !onRecoverEndurance) return null;

  function doHp() {
    if (!onRecoverHp) return;
    startTransition(async () => {
      try {
        const r = await onRecoverHp();
        setLastResult({ kind: "hp", ...r });
      } catch (e) {
        setLastResult({ kind: "error", message: e instanceof Error ? e.message : "Erreur" });
      }
    });
  }

  function doEndu() {
    if (!onRecoverEndurance) return;
    startTransition(async () => {
      try {
        const r = await onRecoverEndurance();
        setLastResult({ kind: "endu", ...r });
      } catch (e) {
        setLastResult({ kind: "error", message: e instanceof Error ? e.message : "Erreur" });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <CardTitle className="label-grimoire">Récupération</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              Lance les dés de régénération naturelle.
            </CardDescription>
          </div>
          {lastResult && lastResult.kind !== "error" && (
            <span className="tabular text-xs tracking-wider text-muted-foreground">
              {lastResult.kind === "hp"
                ? `Dernier soin : +${lastResult.gain} HP`
                : `Dernier souffle : +${lastResult.gain} Endu`}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between gap-3">
          {/* Glyph gauche — HP */}
          <CalvaryGlyph className="hidden shrink-0 text-ink-tertiary sm:block" size={44} />

          {/* Boutons centraux */}
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={!onRecoverHp || isPending}
              onClick={doHp}
              className="h-auto flex-1 flex-col gap-1 py-3 text-hp hover:text-hp"
            >
              <span className="text-sm font-medium text-foreground">Régénérer HP</span>
              <span className="tabular text-[0.7rem] text-muted-foreground">
                (2d6 + Écaillé) / 2
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={!onRecoverEndurance || isPending}
              onClick={doEndu}
              className="h-auto flex-1 flex-col gap-1 py-3 text-endu hover:text-endu"
            >
              <span className="text-sm font-medium text-foreground">Reprendre souffle</span>
              <span className="tabular text-[0.7rem] text-muted-foreground">
                1d50 / 2
              </span>
            </Button>
          </div>

          {/* Glyph droite — Endurance */}
          <EclipseGlyph className="hidden shrink-0 text-ink-tertiary sm:block" size={44} />
        </div>

        {lastResult && (
          <div className="mt-4 rounded-md bg-muted p-3">
            {lastResult.kind === "hp" && (
              <p className="tabular text-xs leading-relaxed text-ink-muted">
                <span className="text-muted-foreground">2d6</span>{" "}
                <span className="text-foreground">
                  [{lastResult.d1}, {lastResult.d2}]
                </span>
                {" + "}
                <span className="text-hp">Écaillé</span>(
                {lastResult.ecaille}){" "}
                <span className="text-muted-foreground">=</span>{" "}
                <span className="text-foreground">
                  {lastResult.d1 + lastResult.d2 + lastResult.ecaille}
                </span>
                {" → ÷2 ="}{" "}
                <span className="tabular text-lg font-semibold text-hp">
                  +{lastResult.gain} HP
                </span>
                <span className="ml-2 text-muted-foreground">
                  ({lastResult.newHp}/{lastResult.maxHp})
                </span>
              </p>
            )}
            {lastResult.kind === "endu" && (
              <p className="tabular text-xs leading-relaxed text-ink-muted">
                <span className="text-muted-foreground">1d50</span>{" "}
                <span className="text-foreground">[{lastResult.roll}]</span>
                {" → ÷2 = "}
                <span className="tabular text-lg font-semibold text-endu">
                  +{lastResult.gain} Endu
                </span>
                <span className="ml-2 text-muted-foreground">
                  ({lastResult.newEndurance}/{lastResult.maxEndurance})
                </span>
              </p>
            )}
            {lastResult.kind === "error" && (
              <p className="text-xs italic text-hp">
                Erreur : {lastResult.message}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
