"use client";

import { useTransition } from "react";
import { Activity, Shield, Swords, Footprints, Zap } from "lucide-react";
import { ENDURANCE_COSTS } from "@/lib/faith-system";
import type { ActionType } from "./types";

type Props = {
  onActionCost?: (actionType: ActionType) => Promise<void>;
};

type Category = "phy" | "off" | "def" | "esq";

type ActionConfig = {
  key: ActionType;
  label: string;
  sub: string;
  category: Category;
};

const ACTIONS: ActionConfig[] = [
  { key: "physique", label: "Physique", sub: "Action standard", category: "phy" },
  { key: "off_r", label: "Offensive", sub: "Réussie", category: "off" },
  { key: "off_nr", label: "Offensive", sub: "Non-réussie", category: "off" },
  { key: "off_c", label: "Offensive", sub: "Contrée", category: "off" },
  { key: "def_r", label: "Défensive", sub: "Réussie", category: "def" },
  { key: "def_nr", label: "Défensive", sub: "Non-réussie", category: "def" },
  { key: "esq_r", label: "Esquive", sub: "Réussie", category: "esq" },
  { key: "esq_nr", label: "Esquive", sub: "Non-réussie", category: "esq" },
];

const CATEGORY_ICON: Record<Category, typeof Activity> = {
  phy: Activity,
  off: Swords,
  def: Shield,
  esq: Footprints,
};

/**
 * Dépense d'endurance — liste divisée sobre (direction v0 validée).
 * Chaque ligne est cliquable et déclenche `onActionCost` (server action).
 */
export function EnduranceActionPanel({ onActionCost }: Props) {
  const [isPending, startTransition] = useTransition();

  function trigger(actionType: ActionType) {
    if (!onActionCost) return;
    startTransition(async () => {
      await onActionCost(actionType);
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
      aria-label="Dépense d'endurance"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="text-[11px] font-medium uppercase tracking-widest text-foreground-subtle">
          Dépense d&apos;endurance
        </h2>
        <span className="font-mono text-[10px] text-foreground-subtle">
          {ACTIONS.length} actions
        </span>
      </div>

      <ul className="divide-y divide-border">
        {ACTIONS.map((a) => {
          const cost = ENDURANCE_COSTS[a.key].cost;
          const Icon = CATEGORY_ICON[a.category];
          return (
            <li key={a.key}>
              <button
                type="button"
                disabled={isPending || !onActionCost}
                onClick={() => trigger(a.key)}
                className="group flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-surface-overlay/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-3">
                  <Icon
                    size={13}
                    className="text-foreground-subtle transition-colors group-hover:text-foreground-muted"
                    aria-hidden
                  />
                  <span className="flex items-baseline gap-2">
                    <span className="text-sm text-foreground-muted transition-colors group-hover:text-foreground">
                      {a.label}
                    </span>
                    <span className="text-xs text-foreground-subtle">
                      {a.sub}
                    </span>
                  </span>
                </span>

                <span className="flex items-center gap-2">
                  <span className="rounded border border-border bg-white/[0.04] px-2 py-0.5 font-mono text-xs tabular-nums tracking-wide text-foreground-muted">
                    −{cost}
                  </span>
                  <span className="w-7 text-right text-[10px] uppercase tracking-widest text-foreground-subtle">
                    END
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div
        className="flex items-center gap-2 border-t border-border px-5 py-3"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        <Zap size={11} className="text-foreground-subtle" aria-hidden />
        <p className="text-[11px] text-foreground-subtle">
          Les coûts s&apos;appliquent avant la résolution de l&apos;action.
        </p>
      </div>
    </section>
  );
}
