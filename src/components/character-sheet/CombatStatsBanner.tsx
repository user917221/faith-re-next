"use client";

/**
 * CombatStatsBanner — bandeau des 4 stats de combat (Phase 2).
 * Initiative / Armure / Vitesse / Maîtrise, avec steppers inline si éditable.
 * Style aligné campaign-panel (chaud/or) + chiffres mono tabular.
 */

import { useTransition } from "react";
import { Minus, Plus, Swords, Shield, Footprints, Target } from "lucide-react";
import type { Character, CombatStatKey } from "./types";

const STATS: {
  key: CombatStatKey;
  label: string;
  icon: typeof Swords;
  signed?: boolean;
}[] = [
  { key: "initiative", label: "Initiative", icon: Swords, signed: true },
  { key: "armor", label: "Armure", icon: Shield },
  { key: "movement", label: "Vitesse", icon: Footprints },
  { key: "proficiency", label: "Maîtrise", icon: Target, signed: true },
];

export function CombatStatsBanner({
  character,
  onCombatStatChange,
}: {
  character: Character;
  onCombatStatChange?: (key: CombatStatKey, delta: number) => Promise<void>;
}) {
  const editable = Boolean(onCombatStatChange);

  return (
    <section className="campaign-panel">
      <header className="campaign-header-line flex items-center justify-between px-4 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
          Combat
        </p>
      </header>
      <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
        {STATS.map((stat) => (
          <CombatStatCell
            key={stat.key}
            stat={stat}
            value={character[stat.key]}
            editable={editable}
            onChange={onCombatStatChange}
          />
        ))}
      </div>
    </section>
  );
}

function CombatStatCell({
  stat,
  value,
  editable,
  onChange,
}: {
  stat: (typeof STATS)[number];
  value: number;
  editable: boolean;
  onChange?: (key: CombatStatKey, delta: number) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const Icon = stat.icon;
  const display =
    stat.signed && value >= 0 ? `+${value}` : `${value}`;

  const step = (delta: number) => {
    if (!onChange) return;
    startTransition(() => onChange(stat.key, delta));
  };

  return (
    <div className="flex flex-col items-center gap-1.5 px-3 py-3">
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
        <Icon size={11} aria-hidden />
        {stat.label}
      </span>
      <div className="flex items-center gap-2">
        {editable && (
          <StepButton
            label={`${stat.label} −1`}
            disabled={isPending}
            onClick={() => step(-1)}
          >
            <Minus size={12} />
          </StepButton>
        )}
        <span className="min-w-[2ch] text-center font-mono text-xl font-semibold tabular-nums slashed-zero text-foreground">
          {display}
        </span>
        {editable && (
          <StepButton
            label={`${stat.label} +1`}
            disabled={isPending}
            onClick={() => step(1)}
          >
            <Plus size={12} />
          </StepButton>
        )}
      </div>
    </div>
  );
}

function StepButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-6 items-center justify-center rounded-md border border-border bg-background/40 text-foreground-subtle transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-40"
    >
      {children}
    </button>
  );
}
