import { SKILL_CAP } from "@/lib/faith-system";

type Props = {
  allocated: number;
};

/**
 * Barre d'allocation des points — ligne compacte (eyebrow + total + jauge).
 * La jauge de progression est le SEUL porteur d'accent lavande de la vue
 * (discipline « accent = signal », réservé à la donnée de progression).
 */
export function PointAllocatorBar({ allocated }: Props) {
  const isCapped = allocated >= SKILL_CAP;
  const pct = Math.min(100, (allocated / SKILL_CAP) * 100);

  return (
    <section
      className="flex items-center gap-4 rounded-xl border border-border px-5 py-3"
      style={{
        background: "rgba(17,19,24,0.98)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <span className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
        Allocation
      </span>
      <span className="shrink-0 font-mono tabular-nums slashed-zero">
        <span
          className="text-base font-semibold"
          style={{ color: isCapped ? "var(--hp)" : "var(--foreground)" }}
        >
          {allocated}
        </span>
        <span className="text-xs text-foreground-subtle"> / {SKILL_CAP}</span>
      </span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: isCapped ? "var(--hp)" : "var(--primary)",
            transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
      {isCapped && (
        <span
          className="shrink-0 font-mono text-[10px] uppercase tracking-widest"
          style={{ color: "var(--hp)" }}
        >
          Cap
        </span>
      )}
    </section>
  );
}
