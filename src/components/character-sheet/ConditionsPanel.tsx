"use client";

/**
 * ConditionsPanel — états actifs d'un perso en chips colorés (Phase 2).
 * buff (vert) / debuff (rouge) / blessure (orange) / focus (cyan) / marqueur (gris).
 * Add via formulaire inline (label + nature), remove via × sur le chip.
 * Lecture seule si aucun handler fourni.
 */

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import type { ConditionItem, ConditionKind } from "./types";

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

const KIND_ORDER: ConditionKind[] = [
  "buff",
  "debuff",
  "wound",
  "focus",
  "neutral",
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
  }) => Promise<void>;
  onRemoveCondition?: (conditionId: string) => Promise<void>;
}) {
  const editable = Boolean(onAddCondition);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<ConditionKind>("neutral");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const trimmed = label.trim();
    if (!trimmed || !onAddCondition) return;
    startTransition(async () => {
      await onAddCondition({ label: trimmed, kind });
      setLabel("");
      setKind("neutral");
      setAdding(false);
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
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") setAdding(false);
              }}
              maxLength={40}
              placeholder="État (ex. Concentré, Saignement…)"
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {KIND_ORDER.map((k) => {
                const meta = KIND_META[k];
                const active = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className="rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors"
                    style={{
                      background: active
                        ? `rgba(${meta.rgb},0.16)`
                        : "transparent",
                      border: `1px solid rgba(${meta.rgb},${active ? 0.4 : 0.18})`,
                      color: active ? `rgb(${meta.rgb})` : "var(--foreground-subtle)",
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdding(false)}
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
        )}
      </div>
    </section>
  );
}
