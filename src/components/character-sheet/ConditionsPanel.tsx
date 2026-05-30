"use client";

/**
 * ConditionsPanel — états actifs d'un perso en chips colorés (Phase 2).
 * buff (vert) / debuff (rouge) / blessure (orange) / focus (cyan) / marqueur (gris).
 *
 * Ajout via formulaire inline : on choisit d'abord une condition prédéfinie
 * (Fatigue, Blessure grave, Saignement, Sommeil, Faim, Debuff, Buff, Focus…)
 * qui pré-remplit le libellé, la nature (couleur) et un modificateur de dé.
 * Le libellé et le modificateur restent ajustables (condition libre). Le
 * modificateur signé s'applique aux jets côté serveur (ex. Fatigue −4).
 * Remove via × sur le chip. Lecture seule si aucun handler fourni.
 */

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import type { ConditionItem, ConditionKind, ConditionPreset } from "./types";

const KIND_META: Record<
  ConditionKind,
  { label: string; rgb: string }
> = {
  buff: { label: "Buff", rgb: "130,169,107" }, // --endu
  debuff: { label: "Debuff", rgb: "200,95,80" }, // --hp
  wound: { label: "Blessure", rgb: "204,132,88" }, // orange
  focus: { label: "Focus", rgb: "111,166,184" }, // --mhp
  neutral: { label: "Marqueur", rgb: "150,150,168" }, // gris
};

// Conditions prédéfinies — sélectionnables d'un clic. Couleur portée par `kind`.
const CONDITION_PRESETS: ConditionPreset[] = [
  { label: "Fatigue", kind: "debuff", diceModifier: -4 },
  { label: "Blessure grave", kind: "wound", diceModifier: -2 },
  { label: "Saignement", kind: "wound", diceModifier: -1 },
  { label: "Sommeil", kind: "debuff", diceModifier: -2 },
  { label: "Faim", kind: "debuff", diceModifier: -1 },
  { label: "Concentration", kind: "focus", diceModifier: 0 },
  { label: "Buff", kind: "buff", diceModifier: 2 },
  { label: "Marqueur", kind: "neutral", diceModifier: 0 },
];

export function ConditionsPanel({
  conditions,
  onAddCondition,
  onRemoveCondition,
}: {
  conditions: ConditionItem[];
  onAddCondition?: (input: {
    label: string;
    kind: ConditionKind;
    diceModifier?: number;
  }) => Promise<void>;
  onRemoveCondition?: (conditionId: string) => Promise<void>;
}) {
  const editable = Boolean(onAddCondition);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<ConditionKind>("neutral");
  const [diceModifier, setDiceModifier] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  const selectPreset = (p: ConditionPreset) => {
    setLabel(p.label);
    setKind(p.kind);
    setDiceModifier(p.diceModifier);
  };

  const resetForm = () => {
    setLabel("");
    setKind("neutral");
    setDiceModifier(0);
    setAdding(false);
  };

  const submit = () => {
    const trimmed = label.trim();
    if (!trimmed || !onAddCondition) return;
    startTransition(async () => {
      await onAddCondition({ label: trimmed, kind, diceModifier });
      resetForm();
    });
  };

  return (
    <section className="campaign-panel">
      <header className="campaign-header-line flex items-center justify-between px-4 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
          Conditions
        </p>
        {editable && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            aria-expanded={adding}
            className="flex items-center gap-1 rounded-md border border-border bg-background/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus size={11} /> Ajouter
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3 p-3">
        {conditions.length === 0 && !adding ? (
          <p className="px-1 py-1.5 text-xs text-foreground-subtle">
            Aucune condition active.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {conditions.map((c) => {
              const meta = KIND_META[c.kind];
              const mod = c.diceModifier ?? 0;
              return (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
                  style={{
                    background: `rgba(${meta.rgb},0.12)`,
                    border: `1px solid rgba(${meta.rgb},0.32)`,
                    color: `rgb(${meta.rgb})`,
                  }}
                  title={meta.label}
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: `rgb(${meta.rgb})` }}
                    aria-hidden
                  />
                  <span>{c.label}</span>
                  {mod !== 0 && (
                    <span className="font-mono text-[10px] tabular-nums opacity-80">
                      {mod > 0 ? `+${mod}` : mod}
                    </span>
                  )}
                  {onRemoveCondition && (
                    <button
                      type="button"
                      aria-label={`Retirer ${c.label}`}
                      onClick={() =>
                        startTransition(() => onRemoveCondition(c.id))
                      }
                      disabled={isPending}
                      className="ml-0.5 rounded-sm opacity-60 transition-opacity hover:opacity-100 disabled:opacity-30"
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        )}

        {editable && adding && (
          <div className="flex flex-col gap-2.5 rounded-md border border-border bg-background/30 p-2.5">
            {/* Conditions prédéfinies — pré-remplissent label + nature + modif dé */}
            <div className="flex flex-wrap gap-1.5">
              {CONDITION_PRESETS.map((p) => {
                const meta = KIND_META[p.kind];
                const active = label === p.label && kind === p.kind;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => selectPreset(p)}
                    className="rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors"
                    style={{
                      background: active
                        ? `rgba(${meta.rgb},0.16)`
                        : "transparent",
                      border: `1px solid rgba(${meta.rgb},${active ? 0.4 : 0.18})`,
                      color: active ? `rgb(${meta.rgb})` : "var(--foreground-subtle)",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") resetForm();
              }}
              maxLength={40}
              placeholder="État (ex. Concentré, Saignement…)"
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                  Modif dé
                </label>
                <input
                  type="number"
                  min={-20}
                  max={20}
                  value={diceModifier}
                  onChange={(e) =>
                    setDiceModifier(
                      Math.max(
                        -20,
                        Math.min(20, parseInt(e.target.value || "0", 10) || 0),
                      ),
                    )
                  }
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Modificateur de dé"
                  className="h-7 w-14 rounded-md border border-border bg-background px-2 text-center font-mono text-sm tabular-nums text-foreground focus:border-primary/40 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md px-2.5 py-1 text-xs text-foreground-subtle transition-colors hover:text-foreground"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={isPending || !label.trim()}
                  className="rounded-md bg-foreground px-3 py-1 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
