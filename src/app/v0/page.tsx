"use client"

import { useState } from "react"
import { CharacterHeader } from "@/components/faith/CharacterHeader"
import { VitauxTab } from "@/components/faith/VitauxTab"
import { CompetencesTab } from "@/components/faith/CompetencesTab"
import { EvolutionTab } from "@/components/faith/EvolutionTab"
import { ProfilTab } from "@/components/faith/ProfilTab"

type Tab = "vitaux" | "competences" | "evolution" | "profil"

const TABS: { id: Tab; label: string }[] = [
  { id: "vitaux", label: "Vitaux" },
  { id: "competences", label: "Compétences" },
  { id: "evolution", label: "Évolution" },
  { id: "profil", label: "Profil" },
]

export default function Page() {
  const [active, setActive] = useState<Tab>("vitaux")

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      {/* App bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-5 h-11 border-b border-border"
        style={{
          background: "rgba(12,13,15,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="font-mono text-sm font-semibold tracking-[0.15em]"
            style={{ color: "var(--accent)", letterSpacing: "0.14em" }}
          >
            FAITH:RE
          </span>
          <span
            className="text-[10px] font-mono text-foreground-subtle border border-border rounded px-1.5 py-px"
          >
            v0.4.1
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-foreground-subtle">Mode MJ</span>
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent)", opacity: 0.7 }}
            aria-hidden="true"
          />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-16 pt-6 space-y-4">
        {/* Character header */}
        <CharacterHeader />

        {/* Tab nav */}
        <nav
          className="flex items-center rounded-xl border border-border overflow-hidden"
          style={{
            background: "rgba(17,19,24,0.98)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
          aria-label="Navigation par onglets"
          role="tablist"
        >
          {TABS.map((tab, i) => {
            const isActive = active === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActive(tab.id)}
                className="relative flex-1 py-2.5 text-xs font-medium transition-colors"
                style={{
                  color: isActive ? "var(--foreground)" : "var(--foreground-subtle)",
                  background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
                  borderRight:
                    i < TABS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  outline: "none",
                }}
              >
                {tab.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ background: "var(--accent)", opacity: 0.8 }}
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Tab panels */}
        <div role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`}>
          {active === "vitaux" && <VitauxTab />}
          {active === "competences" && <CompetencesTab />}
          {active === "evolution" && <EvolutionTab />}
          {active === "profil" && <ProfilTab />}
        </div>
      </main>
    </div>
  )
}
