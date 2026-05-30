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
import { Plus, X, Loader2 } from "lucide-react";
import type { ConditionItem, ConditionKind, ConditionPreset } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  { label: "Buff", kind: "buff", diceModifier: 2 },
  { label: "Debuff", kind: "debuff", diceModifier: -2 },
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
  const [activeDeletingId, setActiveDeletingId] = useState<string | null>(null);

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

  const handleRemove = (id: string) => {
    if (!onRemoveCondition) return;
    setActiveDeletingId(id);
    startTransition(async () => {
      try {
        await onRemoveCondition(id);
      } finally {
        setActiveDeletingId(null);
      }
    });
  };

  return (
    <section className="campaign-panel">
      <header className="campaign-header-line flex items-center justify-between px-4 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
          Conditions
        </p>
        {editable && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setAdding((v) => !v)}
            aria-expanded={adding}
            className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em]"
          >
            <Plus size={11} /> Ajouter
          </Button>
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
              const isDeleting = activeDeletingId === c.id && isPending;
              return (
                <Badge
                  key={c.id}
                  variant="outline"
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium border rounded-md"
                  style={{
                    background: `rgba(${meta.rgb},0.12)`,
                    borderColor: `rgba(${meta.rgb},0.32)`,
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
                      onClick={() => handleRemove(c.id)}
                      disabled={isPending}
                      className="ml-0.5 rounded-sm opacity-60 transition-opacity hover:opacity-100 disabled:opacity-30 flex items-center justify-center size-3"
                    >
                      {isDeleting ? (
                        <Loader2 size={10} className="animate-spin text-inherit" />
                      ) : (
                        <X size={11} />
                      )}
                    </button>
                  )}
                </Badge>
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
                  <Button
                    key={p.label}
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => selectPreset(p)}
                    className="font-mono text-[10px] uppercase tracking-[0.1em]"
                    style={{
                      background: active
                        ? `rgba(${meta.rgb},0.16)`
                        : "transparent",
                      border: `1px solid rgba(${meta.rgb},${active ? 0.4 : 0.18})`,
                      color: active ? `rgb(${meta.rgb})` : "var(--foreground-subtle)",
                    }}
                  >
                    {p.label}
                  </Button>
                );
              })}
            </div>

            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") resetForm();
              }}
              maxLength={40}
              placeholder="État (ex. Concentré, Saignement…)"
              disabled={isPending}
              className="h-9 w-full bg-background"
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                  Modif dé
                </label>
                {/* Signe explicite : le modificateur peut être bonus (+) ou malus (−) */}
                <div className="flex items-center overflow-hidden rounded-md border border-border h-7">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setDiceModifier((m) => -Math.abs(m))}
                    aria-label="Malus (négatif)"
                    aria-pressed={diceModifier < 0}
                    className={`h-full rounded-none px-2.5 font-mono text-sm leading-none border-r border-border transition-colors ${
                      diceModifier < 0
                        ? "bg-hp/20 text-hp hover:bg-hp/30 hover:text-hp"
                        : "text-foreground-subtle hover:bg-surface-overlay"
                    }`}
                  >
                    −
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setDiceModifier((m) => Math.abs(m))}
                    aria-label="Bonus (positif)"
                    aria-pressed={diceModifier >= 0}
                    className={`h-full rounded-none px-2.5 font-mono text-sm leading-none transition-colors ${
                      diceModifier >= 0
                        ? "bg-endu/20 text-endu hover:bg-endu/30 hover:text-endu"
                        : "text-foreground-subtle hover:bg-surface-overlay"
                    }`}
                  >
                    +
                  </Button>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={Math.abs(diceModifier)}
                  onChange={(e) => {
                    const mag = Math.max(
                      0,
                      Math.min(20, parseInt(e.target.value || "0", 10) || 0),
                    );
                    setDiceModifier(diceModifier < 0 ? -mag : mag);
                  }}
                  onFocus={(e) => e.currentTarget.select()}
                  disabled={isPending}
                  aria-label="Amplitude du modificateur de dé"
                  className="h-7 w-12 bg-background p-0 text-center font-mono text-sm tabular-nums text-foreground [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none focus-visible:border-primary/40"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={resetForm}
                  className="text-foreground-subtle"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  size="xs"
                  onClick={submit}
                  disabled={isPending || !label.trim()}
                  className="px-3"
                >
                  {isPending ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    "Ajouter"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
