"use client"

import { VitalGauge } from "./VitalGauge"
import { Swords, Shield, Footprints, Zap } from "lucide-react"

const ENDURANCE_ACTIONS = [
  { label: "Physique", cost: -10 },
  { label: "Offensive Réussie", cost: -20 },
  { label: "Offensive Non-réussie", cost: -30 },
  { label: "Offensive Contrée", cost: -40 },
  { label: "Défensive Réussie", cost: -10 },
  { label: "Défensive Non-réussie", cost: -20 },
  { label: "Esquive Réussie", cost: -5 },
  { label: "Esquive Non-réussie", cost: -10 },
]

export function VitauxTab() {
  return (
    <div className="space-y-4">
      {/* Gauges card */}
      <section
        className="rounded-xl border border-border bg-surface p-6"
        style={{
          background:
            "linear-gradient(145deg, rgba(28,30,40,0.95) 0%, rgba(17,19,24,0.98) 100%)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
        aria-label="Jauges de vitalité"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[11px] font-medium uppercase tracking-widest text-foreground-subtle">
            État vital
          </h2>
          <span className="text-[10px] font-mono text-foreground-subtle bg-surface-overlay border border-border px-2 py-0.5 rounded-full">
            Actif
          </span>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6 place-items-center">
          <VitalGauge
            label="Santé"
            value={125}
            max={125}
            color="var(--gauge-sante)"
            step={5}
          />
          <VitalGauge
            label="Mental"
            value={125}
            max={125}
            color="var(--gauge-mental)"
            step={5}
          />
          <VitalGauge
            label="Endurance"
            value={750}
            max={750}
            color="var(--gauge-endurance)"
            step={10}
            size={120}
          />
          <VitalGauge
            label="Flux"
            value={600}
            max={750}
            color="var(--gauge-flux)"
            step={10}
          />
        </div>
      </section>

      {/* Endurance spend card */}
      <section
        className="rounded-xl border border-border overflow-hidden"
        style={{
          background: "rgba(17,19,24,0.98)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
        aria-label="Dépense d'endurance"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="text-[11px] font-medium uppercase tracking-widest text-foreground-subtle">
            Dépense d&apos;endurance
          </h2>
          <span className="text-[10px] font-mono text-foreground-subtle">
            8 actions
          </span>
        </div>

        <ul className="divide-y divide-border">
          {ENDURANCE_ACTIONS.map((action, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between px-5 py-3 group hover:bg-surface-overlay/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center">
                  {idx < 4 ? (
                    <Swords
                      size={13}
                      className="text-foreground-subtle group-hover:text-foreground-muted transition-colors"
                    />
                  ) : idx < 6 ? (
                    <Shield
                      size={13}
                      className="text-foreground-subtle group-hover:text-foreground-muted transition-colors"
                    />
                  ) : (
                    <Footprints
                      size={13}
                      className="text-foreground-subtle group-hover:text-foreground-muted transition-colors"
                    />
                  )}
                </span>
                <span className="text-sm text-foreground-muted group-hover:text-foreground transition-colors">
                  {action.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "var(--foreground-muted)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {action.cost}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-foreground-subtle w-4 text-right">
                  END
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div
          className="px-5 py-3 flex items-center gap-2 border-t border-border"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <Zap size={11} className="text-foreground-subtle" />
          <p className="text-[11px] text-foreground-subtle">
            Les coûts s&apos;appliquent avant la résolution de l&apos;action.
          </p>
        </div>
      </section>
    </div>
  )
}
