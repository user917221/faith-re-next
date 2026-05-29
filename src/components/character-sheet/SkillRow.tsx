"use client";

import { useTransition } from "react";
import { Dices, Minus, Plus } from "lucide-react";
import { SKILL_DESCRIPTIONS, SKILL_TO_ATTRIBUTE, type AttributeName } from "@/lib/skills";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RollContext } from "./DDDrawer";

type Props = {
  name: string;
  value: number;
  attrScore: number;
  isCapped: boolean;
  onSkillChange?: (skillName: string, delta: 1 | -1) => Promise<void>;
  onOpenRollDrawer?: (ctx: RollContext & { attrName: AttributeName; skillName: string }) => void;
};

export function SkillRow({ name, value, attrScore, isCapped, onSkillChange, onOpenRollDrawer }: Props) {
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

  return (
    <div className="group -mx-1.5 flex items-center justify-between gap-3 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted">
      {description ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help truncate font-medium text-ink-muted transition-colors group-hover:text-foreground">
              {name}
            </span>
          </TooltipTrigger>
          <TooltipContent>{description}</TooltipContent>
        </Tooltip>
      ) : (
        <span className="truncate font-medium text-ink-muted transition-colors group-hover:text-foreground">
          {name}
        </span>
      )}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Retirer un point de ${name}`}
          disabled={minusDisabled}
          onClick={() => adjust(-1)}
        >
          <Minus className="size-3" />
        </Button>
        <span className="tabular w-5 text-center font-semibold text-foreground">
          {value}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Ajouter un point à ${name}`}
          disabled={plusDisabled}
          onClick={() => adjust(1)}
        >
          <Plus className="size-3" />
        </Button>
        {onOpenRollDrawer && attrName && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Lancer 2d6 + ${name}`}
            title={`Lancer 2d6 + ${attrName} + ${name}`}
            onClick={openRoll}
            className="ml-0.5 text-muted-foreground hover:text-primary-hover"
          >
            <Dices className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
