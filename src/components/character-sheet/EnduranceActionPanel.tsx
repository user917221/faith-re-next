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

const CATEGORY_COST: Record<ActionConfig["category"], string> = {
  phy: "text-celadon",
  off: "text-blood-dried",
  def: "text-amethyst",
  esq: "text-gold-bright",
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
    <section className="card-grimoire flex flex-col gap-4">
      <span className="label-grimoire">Dépense d&apos;endurance</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACTIONS.map((a) => {
          const cost = ENDURANCE_COSTS[a.key].cost;
          const costColor = CATEGORY_COST[a.category];
          return (
            <button
              key={a.key}
              type="button"
              disabled={isPending || !onActionCost}
              onClick={() => trigger(a.key)}
              className="group flex flex-col items-center justify-center gap-1 rounded-[--radius-sm] border border-gold-aged/10 bg-ink-far px-2 py-3 text-parchment transition-all hover:border-gold-aged/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gold-aged/10"
            >
              <span className="font-display text-[0.7rem] font-medium uppercase tracking-[0.15em] text-parchment">
                {a.label}
              </span>
              <span className="text-[0.65rem] italic text-parchment-mute">
                {a.sub}
              </span>
              <span className={`tabular text-2xl font-bold leading-none ${costColor}`}>
                −{cost}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
