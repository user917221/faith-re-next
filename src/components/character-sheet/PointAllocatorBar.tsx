import { SKILL_CAP } from "@/lib/faith-system";

type Props = {
  allocated: number;
};

export function PointAllocatorBar({ allocated }: Props) {
  const isCapped = allocated >= SKILL_CAP;
  const pct = Math.min(100, (allocated / SKILL_CAP) * 100);

  return (
    <div className="card-grimoire flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span aria-hidden className="text-gold-aged text-base">
            ✧
          </span>
          <span className="label-grimoire">Allocation</span>
          <span className="tabular text-2xl font-bold text-gold-bright leading-none">
            {allocated}
          </span>
          <span className="text-parchment-mute text-sm">/</span>
          <span className="tabular text-sm text-parchment-mute">
            {SKILL_CAP} pts
          </span>
        </div>
        {isCapped && (
          <span className="font-display text-[0.65rem] uppercase tracking-[0.22em] italic text-blood-dried">
            Cap atteint
          </span>
        )}
      </div>
      <div className="h-px overflow-hidden rounded-full bg-ink-deep">
        <div
          className={`h-full transition-[width] ${
            isCapped ? "bg-blood-dried" : "bg-gold-aged"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
