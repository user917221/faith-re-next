"use client";

import { useTransition } from "react";
import { ENDURANCE_COSTS } from "@/lib/faith-system";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  phy: "text-endu",
  off: "text-hp",
  def: "text-mhp",
  esq: "text-primary",
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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Dépense d&apos;endurance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ACTIONS.map((a) => {
            const cost = ENDURANCE_COSTS[a.key].cost;
            const costColor = CATEGORY_COST[a.category];
            return (
              <Button
                key={a.key}
                type="button"
                variant="outline"
                disabled={isPending || !onActionCost}
                onClick={() => trigger(a.key)}
                className="h-auto flex-col gap-1 py-3"
              >
                <span className="text-sm font-medium text-foreground">
                  {a.label}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {a.sub}
                </span>
                <span
                  className={`tabular text-2xl font-semibold leading-none ${costColor}`}
                >
                  −{cost}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
