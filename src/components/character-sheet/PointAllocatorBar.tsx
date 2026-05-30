import { SKILL_CAP } from "@/lib/faith-system";

type Props = {
  allocated: number;
  cap?: number;
};

/**
 * Barre d'allocation des points — ligne compacte (eyebrow + total + jauge).
 * La jauge de progression est le SEUL porteur d'accent lavande de la vue
 * (discipline « accent = signal », réservé à la donnée de progression).
 */
export function PointAllocatorBar({ allocated, cap = SKILL_CAP }: Props) {
  const isCapped = allocated >= cap;
  const pct = Math.min(100, (allocated / cap) * 100);

  return (
    <section
      className="campaign-panel flex items-center gap-4 px-5 py-3"
    >
      <span className="eyebrow shrink-0">Allocation</span>
      <span className="shrink-0 font-mono tabular-nums slashed-zero">
        <span
          className="text-base font-semibold"
          style={{ color: isCapped ? "var(--hp)" : "var(--foreground)" }}
        >
          {allocated}
        </span>
        <span className="text-xs text-foreground-subtle"> / {cap}</span>
      </span>
      <div className="vital-track flex-1">
        <div
          className="vital-track-fill"
          style={{
            width: `${pct}%`,
            background: isCapped ? "var(--hp)" : "var(--primary)",
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
