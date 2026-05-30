/**
 * Campaign Status — bloc de pied de sidebar (cockpit MJ).
 * Phase 1 : données passées en props (stub côté /cockpit ; câblé table `campaign` en Phase 5).
 */
type Props = {
  threatLevel?: number; // 0..5
  morale?: number; // 0..5
  questsActive?: number;
  downtime?: string;
};

function Meter({ value, max = 5, tone }: { value: number; max?: number; tone: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="h-1 flex-1 rounded-full"
          style={{ backgroundColor: i < value ? tone : "rgba(255,255,255,0.08)" }}
        />
      ))}
    </div>
  );
}

export function CampaignStatus({
  threatLevel = 4,
  morale = 3,
  questsActive = 5,
  downtime = "2 jours",
}: Props) {
  return (
    <div className="campaign-subpanel flex flex-col gap-2.5 p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-foreground-subtle">
        Statut de campagne
      </p>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-foreground-muted">Menace</span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-hp">
            Élevée
          </span>
        </div>
        <Meter value={threatLevel} tone="var(--hp)" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-foreground-muted">Moral</span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-endu">
            Stable
          </span>
        </div>
        <Meter value={morale} tone="var(--endu)" />
      </div>
      <div className="mt-0.5 flex items-center justify-between border-t border-border pt-2 text-[11px]">
        <span className="text-foreground-muted">Quêtes</span>
        <span className="font-mono tabular-nums slashed-zero text-foreground">
          {questsActive}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-foreground-muted">Repos</span>
        <span className="font-mono tabular-nums slashed-zero text-foreground-muted">
          {downtime}
        </span>
      </div>
    </div>
  );
}
