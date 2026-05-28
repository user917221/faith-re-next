import { SKILL_CAP } from "@/lib/faith-system";

type Props = {
  allocated: number;
};

export function PointAllocatorBar({ allocated }: Props) {
  const isCapped = allocated >= SKILL_CAP;
  const pct = Math.min(100, (allocated / SKILL_CAP) * 100);

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border px-4 py-3 ${
        isCapped
          ? "border-rose-500/30 bg-rose-500/[0.05]"
          : "border-amber-400/20 bg-amber-400/[0.05]"
      }`}
    >
      <div className="flex items-center justify-between text-sm font-semibold">
        <span
          className={`flex items-center gap-2 ${
            isCapped ? "text-rose-300" : "text-amber-300"
          }`}
        >
          <span aria-hidden>🎯</span>
          Allocation : <strong>{allocated}</strong> / {SKILL_CAP} pts
        </span>
        {isCapped && (
          <span className="text-xs uppercase tracking-wider text-rose-300/80">
            Cap atteint
          </span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full transition-[width] ${
            isCapped ? "bg-rose-400" : "bg-amber-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
