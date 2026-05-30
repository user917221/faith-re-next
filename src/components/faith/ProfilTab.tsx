"use client"

import { Info, FileText, Tag } from "lucide-react"

const TRAITS = [
  "Instinct de combat",
  "Mémoire eidétique",
  "Résistance à la douleur",
  "Réseau de contacts",
]

const DEFAUTS = ["Méfiance pathologique", "Impulsivité"]

const NOTES = `Brad est un ancien soldat reconverti en opérateur freelance. Son passé dans les Forces de Stabilisation lui confère une rigueur tactique rare. Il opère seul la plupart du temps, mais a développé une loyauté discrète envers son groupe actuel.

Sa relation au Flux est récente — il n'a découvert ses aptitudes qu'à 22 ans lors d'un incident sur Korryn. Il les maîtrise encore mal, préférant s'en remettre à ses réflexes physiques.`

export function ProfilTab() {
  return (
    <div className="space-y-4">
      {/* Bio card */}
      <section
        className="rounded-xl border border-border p-5"
        style={{
          background:
            "linear-gradient(145deg, rgba(28,30,40,0.95) 0%, rgba(17,19,24,0.98) 100%)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText size={13} className="text-foreground-subtle" />
          <h3 className="text-[11px] font-medium uppercase tracking-widest text-foreground-subtle">
            Biographie
          </h3>
        </div>
        <p className="text-sm text-foreground-muted leading-relaxed whitespace-pre-line">
          {NOTES}
        </p>
      </section>

      {/* Traits & Défauts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <section
          className="rounded-xl border border-border overflow-hidden"
          style={{
            background: "rgba(17,19,24,0.98)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <Tag size={11} className="text-foreground-subtle" />
            <h3 className="text-[11px] font-medium uppercase tracking-widest text-foreground-subtle">
              Traits
            </h3>
          </div>
          <ul className="divide-y divide-border">
            {TRAITS.map((t, i) => (
              <li
                key={i}
                className="px-5 py-2.5 flex items-center gap-2.5 hover:bg-surface-overlay/50 transition-colors"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: "var(--foreground-subtle)" }}
                />
                <span className="text-sm text-foreground-muted">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="rounded-xl border border-border overflow-hidden"
          style={{
            background: "rgba(17,19,24,0.98)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <Info size={11} className="text-foreground-subtle" />
            <h3 className="text-[11px] font-medium uppercase tracking-widest text-foreground-subtle">
              Défauts
            </h3>
          </div>
          <ul className="divide-y divide-border">
            {DEFAUTS.map((d, i) => (
              <li
                key={i}
                className="px-5 py-2.5 flex items-center gap-2.5 hover:bg-surface-overlay/50 transition-colors"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                />
                <span className="text-sm text-foreground-muted">{d}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Misc info grid */}
      <section
        className="rounded-xl border border-border p-5"
        style={{
          background: "rgba(17,19,24,0.98)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <h3 className="text-[11px] font-medium uppercase tracking-widest text-foreground-subtle mb-4">
          Informations
        </h3>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            ["Archétype", "Combattant"],
            ["Origine", "Station Kaïros"],
            ["Affiliation", "Indépendant"],
            ["Morphotype", "Augmenté léger"],
            ["Langue principale", "Commun"],
            ["Niveau de menace", "Modéré"],
          ].map(([key, val]) => (
            <div key={key} className="space-y-0.5">
              <dt className="text-[10px] uppercase tracking-widest text-foreground-subtle">
                {key}
              </dt>
              <dd className="text-sm text-foreground-muted">{val}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
