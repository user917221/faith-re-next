"use client";

import { useTransition } from "react";
import { Dices, Minus, Plus } from "lucide-react";
import {
  SKILL_DESCRIPTIONS,
  SKILL_TO_ATTRIBUTE,
  SKILL_DISPLAY_MAX,
  getSkillTier,
  type AttributeName,
} from "@/lib/skills";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RollContext } from "./DDDrawer";

type Props = {
  name: string;
  value: number;
  attrScore: number;
  isCapped: boolean;
  onSkillChange?: (skillName: string, delta: 1 | -1) => Promise<void>;
  onOpenRollDrawer?: (
    ctx: RollContext & { attrName: AttributeName; skillName: string },
  ) => void;
};

/**
 * Ligne de compétence enrichie (Phase 4) : rang/palier + MOD (bonus au jet) +
 * barre de niveau, allocation +/− et jet conservés. Le moteur de jets est
 * inchangé — RANK/MOD/PROG sont dérivés des points.
 */
export function SkillRow({
  name,
  value,
  attrScore,
  isCapped,
  onSkillChange,
  onOpenRollDrawer,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const description = SKILL_DESCRIPTIONS[name] ?? "";
  const attrName = SKILL_TO_ATTRIBUTE[name];
  const tier = getSkillTier(value);
  const fill = Math.min(100, (value / SKILL_DISPLAY_MAX) * 100);

  function adjust(delta: 1 | -1) {
    if (!onSkillChange) return;
    if (delta === 1 && isCapped) return;
    if (delta === -1 && value <= 0) return;
    startTransition(async () => {
      await onSkillChange(name, delta);
    });
  }

  function openRoll() {
    if (!onOpenRollDrawer || !attrName) return;
    // Jet de compétence = 2d6 + compétence (sans l'attribut).
    onOpenRollDrawer({
      title: name,
      bonus: value,
      bonusLabel: `${name} (${value})`,
      attrName,
      skillName: name,
    });
  }

  const plusDisabled = isPending || !onSkillChange || isCapped;
  const minusDisabled = isPending || !onSkillChange || value <= 0;

  const ctrl =
    "flex h-6 w-6 items-center justify-center rounded border border-border text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground active:translate-y-px disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="group px-5 py-2.5 transition-colors hover:bg-surface-overlay/50">
      {/* Ligne 1 — nom · MOD · allocation + jet */}
      <div className="flex items-center">
        {description ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help truncate text-sm text-foreground-muted transition-colors group-hover:text-foreground">
                {name}
              </span>
            </TooltipTrigger>
            <TooltipContent>{description}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="truncate text-sm text-foreground-muted transition-colors group-hover:text-foreground">
            {name}
          </span>
        )}

        <span
          className="mx-2 mb-1.5 min-w-5 flex-1 self-end border-b border-dotted border-white/16"
          aria-hidden
        />

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={`Retirer un point de ${name}`}
            disabled={minusDisabled}
            onClick={() => adjust(-1)}
            className={ctrl}
          >
            <Minus className="size-3" />
          </button>
          <span className="w-6 text-center font-mono text-sm font-semibold tabular-nums slashed-zero text-foreground">
            {value}
          </span>
          <button
            type="button"
            aria-label={`Ajouter un point à ${name}`}
            disabled={plusDisabled}
            onClick={() => adjust(1)}
            className={ctrl}
          >
            <Plus className="size-3" />
          </button>
          {onOpenRollDrawer && attrName && (
            <button
              type="button"
              aria-label={`Lancer 2d6 + ${name}`}
              title={`Lancer 2d6 + ${attrName} + ${name}`}
              onClick={openRoll}
              className="ml-0.5 flex h-6 w-6 items-center justify-center rounded text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-primary"
            >
              <Dices className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Ligne 2 — palier (rang) + barre de niveau */}
      <div className="mt-1.5 flex items-center gap-2.5">
        <span
          className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]"
          style={{
            background: `rgba(${tier.rgb},0.12)`,
            color: `rgb(${tier.rgb})`,
          }}
        >
          {tier.label}
        </span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${fill}%`, background: `rgb(${tier.rgb})` }}
          />
        </div>
      </div>
    </div>
  );
}
