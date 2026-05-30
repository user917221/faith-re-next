"use client"

import { CheckCircle2, Circle, Lock } from "lucide-react"

const XP_ENTRIES = [
  { session: "S01", label: "Prologue — Le Signal", xp: 120, date: "03 Avr" },
  { session: "S02", label: "Arrivée à Station Kaïros", xp: 200, date: "10 Avr" },
  { session: "S03", label: "Le Faussaire de Korryn", xp: 175, date: "17 Avr" },
  { session: "S04", label: "Nuit blanche au Nexus", xp: 250, date: "24 Avr" },
]

const MILESTONES = [
  { label: "Première ascension de Flux", done: true },
  { label: "Débloquer Canalisation Rang 4", done: true },
  { label: "Compléter l'arc Korryn", done: false },
  { label: "Atteindre le Palier T4", done: false, locked: true },
]

const totalXp = XP_ENTRIES.reduce((a, b) => a + b.xp, 0)
const xpToNext = 1000
const xpProgress = Math.round((totalXp / xpToNext) * 100)

export function EvolutionTab() {
  return (
    <div className="space-y-4">
      {/* XP Progress card */}
      <section
        className="rounded-xl border border-border p-5"
        style={{
          background:
            "linear-gradient(145deg, rgba(28,30,40,0.95) 0%, rgba(17,19,24,0.98) 100%)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-foreground-subtle mb-1">
              Progression totale
            </p>
            <p className="text-2xl font-semibold font-mono text-foreground tracking-tight">
              {totalXp.toLocaleString("fr-FR")}
              <span className="text-sm text-foreground-subtle font-normal ml-1.5">XP</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-widest text-foreground-subtle mb-1">
              Prochain palier
            </p>
            <p className="text-sm font-mono text-foreground-muted">
              {(xpToNext - totalXp).toLocaleString("fr-FR")} restants
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden bg-surface-overlay">
          <div
            className="h-full rounded-full"
            style={{
              width: `${xpProgress}%`,
              background: "var(--accent)",
              opacity: 0.7,
              transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-mono text-foreground-subtle">Niv. 3</span>
          <span className="text-[10px] font-mono text-foreground-subtle">
            {xpProgress}% → Niv. 4
          </span>
        </div>
      </section>

      {/* Session log */}
      <section
        className="rounded-xl border border-border overflow-hidden"
        style={{
          background: "rgba(17,19,24,0.98)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-[11px] font-medium uppercase tracking-widest text-foreground-subtle">
            Journal de sessions
          </h3>
        </div>
        <ul className="divide-y divide-border">
          {XP_ENTRIES.map((entry) => (
            <li
              key={entry.session}
              className="flex items-center justify-between px-5 py-3 hover:bg-surface-overlay/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-foreground-subtle bg-surface-overlay border border-border px-2 py-0.5 rounded">
                  {entry.session}
                </span>
                <span className="text-sm text-foreground-muted">{entry.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-foreground-subtle">{entry.date}</span>
                <span className="font-mono text-xs text-foreground-muted">
                  +{entry.xp}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Milestones */}
      <section
        className="rounded-xl border border-border overflow-hidden"
        style={{
          background: "rgba(17,19,24,0.98)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-[11px] font-medium uppercase tracking-widest text-foreground-subtle">
            Jalons
          </h3>
        </div>
        <ul className="divide-y divide-border">
          {MILESTONES.map((m, i) => (
            <li
              key={i}
              className="flex items-center gap-3 px-5 py-3 hover:bg-surface-overlay/50 transition-colors"
            >
              {m.done ? (
                <CheckCircle2 size={14} style={{ color: "var(--accent)", opacity: 0.8 }} />
              ) : m.locked ? (
                <Lock size={13} className="text-foreground-subtle" />
              ) : (
                <Circle size={14} className="text-foreground-subtle" />
              )}
              <span
                className={`text-sm ${
                  m.done
                    ? "text-foreground-muted line-through decoration-foreground-subtle"
                    : m.locked
                    ? "text-foreground-subtle"
                    : "text-foreground-muted"
                }`}
              >
                {m.label}
              </span>
              {m.locked && (
                <span className="ml-auto text-[10px] uppercase tracking-widest text-foreground-subtle border border-border rounded px-1.5 py-px">
                  Verrouillé
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
