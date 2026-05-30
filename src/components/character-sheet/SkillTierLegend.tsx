/**
 * SkillTierLegend — légende des paliers de compétence (Phase 4).
 * Strip mono compact : Novice / Confirmé / Expert / Maître + plages de points.
 */
import { SKILL_TIERS } from "@/lib/skills";

export function SkillTierLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
        Paliers
      </span>
      {SKILL_TIERS.map((t) => (
        <span key={t.key} className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ background: `rgb(${t.rgb})` }}
            aria-hidden
          />
          <span className="text-xs text-foreground-muted">{t.label}</span>
          <span className="font-mono text-[10px] tabular-nums text-foreground-subtle">
            {t.range}
          </span>
        </span>
      ))}
    </div>
  );
}
