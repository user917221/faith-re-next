"use client";

import { useTransition } from "react";
import { ENDURANCE_COSTS } from "@/lib/faith-system";
import type { ActionType } from "./types";

type Props = {
  onActionCost?: (actionType: ActionType) => Promise<void>;
};

type ActionConfig = {
  key: ActionType;
  label: string;
  sub: string;
  category: "phy" | "off" | "def" | "esq";
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

const CATEGORY_STYLES: Record<ActionConfig["category"], { border: string; cost: string }> = {
  phy: {
    border: "hover:border-cyan-400/60 hover:bg-cyan-400/[0.04]",
    cost: "text-cyan-400",
  },
  off: {
    border: "hover:border-rose-500/60 hover:bg-rose-500/[0.04]",
    cost: "text-rose-400",
  },
  def: {
    border: "hover:border-violet-400/60 hover:bg-violet-400/[0.04]",
    cost: "text-violet-300",
  },
  esq: {
    border: "hover:border-amber-400/60 hover:bg-amber-400/[0.04]",
    cost: "text-amber-300",
  },
};

export function EnduranceActionPanel({ onActionCost }: Props) {
  const [isPending, startTransition] = useTransition();

  function trigger(actionType: ActionType) {
    if (!onActionCost) return;
    startTransition(async () => {
      await onActionCost(actionType);
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.01] p-5">
      <span className="text-sm font-semibold uppercase tracking-wider text-white/60">
        Comptabiliser dépense d&apos;endurance
      </span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACTIONS.map((a) => {
          const cost = ENDURANCE_COSTS[a.key].cost;
          const styles = CATEGORY_STYLES[a.category];
          return (
            <button
              key={a.key}
              type="button"
              disabled={isPending || !onActionCost}
              onClick={() => trigger(a.key)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3 text-white/80 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none ${styles.border}`}
            >
              <span className="text-xs font-bold uppercase tracking-wider">
                {a.label}
              </span>
              <span className="text-[10px] text-white/50">{a.sub}</span>
              <span className={`text-base font-extrabold ${styles.cost}`}>
                -{cost}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
