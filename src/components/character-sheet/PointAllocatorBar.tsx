import { SKILL_CAP } from "@/lib/faith-system";

type Props = {
  allocated: number;
};

/** Barre d'allocation des points de compétence — surface sobre (direction v0). */
export function PointAllocatorBar({ allocated }: Props) {
  const isCapped = allocated >= SKILL_CAP;
  const pct = Math.min(100, (allocated / SKILL_CAP) * 100);

  return (
    <section
      className="rounded-xl border border-border px-5 py-4"
      style={{
        background: "rgba(17,19,24,0.98)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-subtle">
            Allocation
          </span>
          <span
            className="font-mono text-2xl font-semibold leading-none tabular-nums"
            style={{ color: isCapped ? "var(--hp)" : "var(--foreground)" }}
          >
            {allocated}
          </span>
          <span className="font-mono text-sm tabular-nums text-foreground-subtle">
            / {SKILL_CAP}
          </span>
        </div>
        {isCapped && (
          <span
            className="text-[10px] font-medium uppercase tracking-widest"
            style={{ color: "var(--hp)" }}
          >
            Cap atteint
          </span>
        )}
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-overlay">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: isCapped ? "var(--hp)" : "var(--accent)",
            transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
    </section>
  );
}
