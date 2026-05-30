"use client";

import { useTransition } from "react";
import { Dices, Minus, Plus } from "lucide-react";
import {
  SKILL_DESCRIPTIONS,
  SKILL_TO_ATTRIBUTE,
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

/** Ligne de compétence sobre (liste divisée, direction v0). Allocation + jet conservés. */
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
    onOpenRollDrawer({
      title: name,
      bonus: attrScore + value,
      bonusLabel: `${attrName} (${attrScore}) + ${name} (${value})`,
      attrName,
      skillName: name,
    });
  }

  const plusDisabled = isPending || !onSkillChange || isCapped;
  const minusDisabled = isPending || !onSkillChange || value <= 0;

  const ctrl =
    "flex h-6 w-6 items-center justify-center rounded border border-border text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground active:translate-y-px disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="group flex items-center px-5 py-2.5 transition-colors hover:bg-surface-overlay/50">
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
  );
}
