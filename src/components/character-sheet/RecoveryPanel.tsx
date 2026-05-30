"use client";

import { useState, useTransition } from "react";
import { Heart, Wind, Dices } from "lucide-react";

type RecoveryResult =
  | { kind: "hp"; gain: number; d1: number; d2: number; ecaille: number; newHp: number; maxHp: number }
  | { kind: "endu"; gain: number; roll: number; newEndurance: number; maxEndurance: number }
  | { kind: "error"; message: string };

type Props = {
  onRecoverHp?: () => Promise<{ gain: number; d1: number; d2: number; ecaille: number; newHp: number; maxHp: number }>;
  onRecoverEndurance?: () => Promise<{ gain: number; roll: number; newEndurance: number; maxEndurance: number }>;
};

/**
 * Récupération — régénération naturelle (dés). Surface sobre (direction v0 validée).
 * Conserve toute la logique : appels server actions + détail du jet.
 */
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
    <section
      className="overflow-hidden rounded-xl border border-border"
      style={{
        background: "rgba(17,19,24,0.98)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
      aria-label="Récupération"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-foreground-subtle">
          <Dices size={12} aria-hidden /> Récupération
        </h2>
        {lastResult && lastResult.kind !== "error" && (
          <span className="font-mono text-[10px] tabular-nums text-foreground-subtle">
            {lastResult.kind === "hp"
              ? `+${lastResult.gain} Santé`
              : `+${lastResult.gain} Endurance`}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <RecoveryButton
          icon={Heart}
          label="Régénérer Santé"
          formula="(2d6 + Écaillé) / 2"
          disabled={!onRecoverHp || isPending}
          onClick={doHp}
        />
        <RecoveryButton
          icon={Wind}
          label="Reprendre souffle"
          formula="1d50 / 2"
          disabled={!onRecoverEndurance || isPending}
          onClick={doEndu}
        />
      </div>

      {lastResult && (
        <div
          className="border-t border-border px-5 py-3"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          {lastResult.kind === "hp" && (
            <p className="font-mono text-[11px] leading-relaxed tabular-nums text-foreground-muted">
              <span className="text-foreground-subtle">2d6</span>{" "}
              [{lastResult.d1}, {lastResult.d2}]
              {" + "}
              <span className="text-foreground-subtle">Écaillé</span>(
              {lastResult.ecaille}) ={" "}
              {lastResult.d1 + lastResult.d2 + lastResult.ecaille}
              {" → ÷2 = "}
              <span className="font-semibold text-foreground">
                +{lastResult.gain}
              </span>
              <span className="ml-2 text-foreground-subtle">
                ({lastResult.newHp}/{lastResult.maxHp})
              </span>
            </p>
          )}
          {lastResult.kind === "endu" && (
            <p className="font-mono text-[11px] leading-relaxed tabular-nums text-foreground-muted">
              <span className="text-foreground-subtle">1d50</span>{" "}
              [{lastResult.roll}]
              {" → ÷2 = "}
              <span className="font-semibold text-foreground">
                +{lastResult.gain}
              </span>
              <span className="ml-2 text-foreground-subtle">
                ({lastResult.newEndurance}/{lastResult.maxEndurance})
              </span>
            </p>
          )}
          {lastResult.kind === "error" && (
            <p className="text-[11px] italic text-foreground-muted">
              Erreur : {lastResult.message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function RecoveryButton({
  icon: Icon,
  label,
  formula,
  disabled,
  onClick,
}: {
  icon: typeof Heart;
  label: string;
  formula: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-overlay/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-white/[0.03] text-foreground-subtle transition-colors group-hover:text-foreground-muted">
        <Icon size={14} aria-hidden />
      </span>
      <span className="flex flex-col">
        <span className="text-sm text-foreground-muted transition-colors group-hover:text-foreground">
          {label}
        </span>
        <span className="font-mono text-[10px] tabular-nums tracking-wide text-foreground-subtle">
          {formula}
        </span>
      </span>
    </button>
  );
}
