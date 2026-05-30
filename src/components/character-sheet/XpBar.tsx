/**
 * XpBar — barre d'XP / niveau, compacte. À rendre **MJ uniquement** (les
 * joueurs ne voient pas leur progression d'XP).
 */
import {
  XP_THRESHOLDS,
  calculateLevel,
  nextLevelXp,
} from "@/lib/faith-system";
import type { Character } from "./types";

export function XpBar({ character }: { character: Character }) {
  const level = calculateLevel(character.xp);
  const isMax = level >= XP_THRESHOLDS.length - 1;
  const floor = XP_THRESHOLDS[level];
  const nextXp = nextLevelXp(level);
  const pct = isMax
    ? 100
    : Math.min(
        100,
        Math.max(0, Math.round(((character.xp - floor) / (nextXp - floor)) * 100)),
      );

  return (
    <section className="campaign-panel flex items-center gap-3 px-5 py-3">
      <span className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
        XP
      </span>
      <span className="shrink-0 font-mono text-xs tabular-nums slashed-zero text-foreground-muted">
        Niv. <span className="text-foreground">{level}</span> · {character.tier}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: "var(--primary)",
            transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
      <span className="shrink-0 font-mono text-xs tabular-nums slashed-zero text-foreground-muted">
        <span className="text-foreground">{character.xp}</span>
        {isMax ? (
          <span className="text-foreground-subtle"> · max</span>
        ) : (
          <span className="text-foreground-subtle"> / {nextXp}</span>
        )}
      </span>
      <span className="shrink-0 rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-primary">
        MJ
      </span>
    </section>
  );
}
