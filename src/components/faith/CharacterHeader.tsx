"use client"

import { Shield, Star, Zap, Activity, TrendingUp, Eye, Clock } from "lucide-react"

const STAT_CHIPS = [
  { icon: Activity, label: "FOR", value: "14" },
  { icon: TrendingUp, label: "AGI", value: "16" },
  { icon: Shield, label: "RES", value: "12" },
  { icon: Star, label: "PER", value: "13" },
  { icon: Zap, label: "FLX", value: "10" },
  { icon: Eye, label: "VOL", value: "11" },
]

export function CharacterHeader() {
  return (
    <header
      className="rounded-xl border border-border p-5"
      style={{
        background:
          "linear-gradient(145deg, rgba(22,24,32,0.98) 0%, rgba(14,15,20,0.99) 100%)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-14 h-14 rounded-xl overflow-hidden"
            style={{
              background: "rgba(94,106,210,0.15)",
              border: "1px solid rgba(94,106,210,0.25)",
              boxShadow: "inset 0 0 20px rgba(94,106,210,0.08)",
            }}
            aria-hidden="true"
          >
            {/* Minimal avatar glyph */}
            <svg viewBox="0 0 56 56" className="w-full h-full" aria-hidden="true">
              <circle cx="28" cy="20" r="9" fill="rgba(255,255,255,0.12)" />
              <ellipse cx="28" cy="44" rx="13" ry="9" fill="rgba(255,255,255,0.08)" />
              <text
                x="28"
                y="24"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.7)"
                fontSize="13"
                fontFamily="Geist, sans-serif"
                fontWeight="600"
              >
                B
              </text>
            </svg>
          </div>
          {/* Online indicator */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              background: "rgba(255,255,255,0.5)",
              borderColor: "var(--background)",
            }}
            aria-label="En session"
          />
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-foreground tracking-tight text-balance">
              Brad
            </h1>
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge label="MJ" accent />
              <Badge label="T3" />
              <Badge label="P2" />
            </div>
          </div>

          <p className="text-sm text-foreground-muted mb-3">
            Niv.&nbsp;3 &mdash; 25 ans
            <span className="mx-2 text-foreground-subtle">·</span>
            <span className="text-foreground-subtle text-xs">Combattant Augmenté</span>
          </p>

          {/* Stat chips row */}
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Statistiques">
            {STAT_CHIPS.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                role="listitem"
                className="flex items-center gap-1.5 rounded-md px-2 py-1"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Icon size={10} className="text-foreground-subtle" aria-hidden="true" />
                <span className="text-[10px] uppercase tracking-widest text-foreground-subtle">
                  {label}
                </span>
                <span className="font-mono text-xs text-foreground-muted font-medium">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Session clock */}
        <div
          className="shrink-0 flex flex-col items-end gap-1 self-start"
          aria-label="Informations de session"
        >
          <div
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <Clock size={11} className="text-foreground-subtle" aria-hidden="true" />
            <span className="font-mono text-[11px] text-foreground-subtle">S04 — en cours</span>
          </div>
          <span className="text-[10px] text-foreground-subtle uppercase tracking-widest">
            Vue MJ
          </span>
        </div>
      </div>
    </header>
  )
}

function Badge({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest"
      style={
        accent
          ? {
              background: "rgba(94,106,210,0.18)",
              border: "1px solid rgba(94,106,210,0.35)",
              color: "#a5abf0",
            }
          : {
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--foreground-muted)",
            }
      }
    >
      {label}
    </span>
  )
}
