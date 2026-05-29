"use client";

import { useState, useTransition } from "react";
import { CalvaryGlyph, EclipseGlyph } from "@/components/glyphs";

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
    <section className="card-grimoire">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="label-grimoire">✚ Récupération</h3>
          <p className="mt-0.5 text-xs text-parchment-mute">
            Lance les dés de régénération naturelle.
          </p>
        </div>
        {lastResult && lastResult.kind !== "error" && (
          <span className="font-display tabular text-[0.7rem] tracking-wider text-gold-bright">
            {lastResult.kind === "hp"
              ? `Dernier soin : +${lastResult.gain} HP`
              : `Dernier souffle : +${lastResult.gain} Endu`}
          </span>
        )}
      </header>

      <div className="flex items-center justify-between gap-3">
        {/* Glyph gauche — HP */}
        <span className="hidden shrink-0 text-blood-dried/55 sm:block">
          <CalvaryGlyph size={64} />
        </span>

        {/* Boutons centraux */}
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={!onRecoverHp || isPending}
            onClick={doHp}
            className="group relative flex-1 overflow-hidden rounded-[--radius-sm] border border-blood-dried/25 bg-ink-far p-4 text-center transition-all hover:-translate-y-px hover:border-blood-dried/50 hover:bg-ink-edge active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.05]"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(179, 90, 90, 0.7), transparent 70%)",
              }}
            />
            <div className="relative z-[1] flex flex-col items-center gap-1">
              <span className="font-display text-sm tracking-[0.1em] text-parchment">
                Régénérer HP
              </span>
              <span className="tabular text-[0.7rem] text-parchment-mute">
                (2d6 + Écaillé) / 2
              </span>
            </div>
          </button>

          <button
            type="button"
            disabled={!onRecoverEndurance || isPending}
            onClick={doEndu}
            className="group relative flex-1 overflow-hidden rounded-[--radius-sm] border border-celadon/25 bg-ink-far p-4 text-center transition-all hover:-translate-y-px hover:border-celadon/50 hover:bg-ink-edge active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.05]"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(142, 176, 145, 0.7), transparent 70%)",
              }}
            />
            <div className="relative z-[1] flex flex-col items-center gap-1">
              <span className="font-display text-sm tracking-[0.1em] text-parchment">
                Reprendre souffle
              </span>
              <span className="tabular text-[0.7rem] text-parchment-mute">
                1d50 / 2
              </span>
            </div>
          </button>
        </div>

        {/* Glyph droite — Endurance */}
        <span className="hidden shrink-0 text-celadon/55 sm:block">
          <EclipseGlyph size={64} />
        </span>
      </div>

      {lastResult && (
        <div className="mt-4 rounded-[--radius-sm] border border-gold-aged/15 bg-ink-deep p-3">
          {lastResult.kind === "hp" && (
            <p className="tabular text-xs leading-relaxed text-parchment-dim">
              <span className="text-gold-aged">2d6</span>{" "}
              <span className="text-parchment">
                [{lastResult.d1}, {lastResult.d2}]
              </span>
              {" + "}
              <span className="text-blood-dried">Écaillé</span>(
              {lastResult.ecaille}){" "}
              <span className="text-parchment-mute">=</span>{" "}
              <span className="text-parchment">
                {lastResult.d1 + lastResult.d2 + lastResult.ecaille}
              </span>
              {" → ÷2 ="}{" "}
              <span className="font-display text-blood-dried text-lg">
                +{lastResult.gain} HP
              </span>
              <span className="ml-2 text-parchment-mute">
                ({lastResult.newHp}/{lastResult.maxHp})
              </span>
            </p>
          )}
          {lastResult.kind === "endu" && (
            <p className="tabular text-xs leading-relaxed text-parchment-dim">
              <span className="text-gold-aged">1d50</span>{" "}
              <span className="text-parchment">[{lastResult.roll}]</span>
              {" → ÷2 = "}
              <span className="font-display text-celadon text-lg">
                +{lastResult.gain} Endu
              </span>
              <span className="ml-2 text-parchment-mute">
                ({lastResult.newEndurance}/{lastResult.maxEndurance})
              </span>
            </p>
          )}
          {lastResult.kind === "error" && (
            <p className="text-xs italic text-blood-dried">
              Erreur : {lastResult.message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
