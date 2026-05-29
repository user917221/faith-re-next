import { SKILL_CAP } from "@/lib/faith-system";
import { Progress } from "@/components/ui/progress";

type Props = {
  allocated: number;
};

export function PointAllocatorBar({ allocated }: Props) {
  const isCapped = allocated >= SKILL_CAP;
  const pct = Math.min(100, (allocated / SKILL_CAP) * 100);

  return (
    <div className="card-grimoire flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Allocation
          </span>
          <span
            className={`tabular text-2xl font-semibold leading-none ${
              isCapped ? "text-hp" : "text-foreground"
            }`}
          >
            {allocated}
          </span>
          <span className="text-sm text-ink-tertiary">/</span>
          <span className="tabular text-sm text-muted-foreground">
            {SKILL_CAP} pts
          </span>
        </div>
        {isCapped && (
          <span className="text-2xs font-medium uppercase tracking-[0.06em] text-hp">
            Cap atteint
          </span>
        )}
      </div>
      <Progress
        value={pct}
        className={isCapped ? "[&>[data-slot=progress-indicator]]:bg-hp" : undefined}
      />
    </div>
  );
}
