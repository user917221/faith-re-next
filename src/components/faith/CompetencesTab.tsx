"use client"

import { useState } from "react"
import { ChevronRight, Search } from "lucide-react"

const SKILL_GROUPS = [
  {
    category: "Combat",
    skills: [
      { name: "Mêlée lourde", rank: 4, max: 6 },
      { name: "Mêlée légère", rank: 3, max: 6 },
      { name: "Distance", rank: 2, max: 6 },
      { name: "Arts martiaux", rank: 5, max: 6 },
    ],
  },
  {
    category: "Agilité",
    skills: [
      { name: "Esquive", rank: 5, max: 6 },
      { name: "Acrobaties", rank: 3, max: 6 },
      { name: "Discrétion", rank: 2, max: 6 },
    ],
  },
  {
    category: "Mental",
    skills: [
      { name: "Perception", rank: 4, max: 6 },
      { name: "Volonté", rank: 3, max: 6 },
      { name: "Tactique", rank: 3, max: 6 },
      { name: "Résistance psych.", rank: 2, max: 6 },
    ],
  },
  {
    category: "Flux",
    skills: [
      { name: "Canalisation", rank: 3, max: 6 },
      { name: "Induction", rank: 2, max: 6 },
    ],
  },
]

function RankPips({ rank, max }: { rank: number; max: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Rang ${rank} sur ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="inline-block rounded-full"
          style={{
            width: 7,
            height: 7,
            background:
              i < rank
                ? i === rank - 1 && rank === max
                  ? "var(--accent)"
                  : "var(--foreground-muted)"
                : "rgba(255,255,255,0.08)",
            transition: "background 0.2s",
          }}
        />
      ))}
    </div>
  )
}

export function CompetencesTab() {
  const [query, setQuery] = useState("")

  const filtered = SKILL_GROUPS.map((g) => ({
    ...g,
    skills: g.skills.filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((g) => g.skills.length > 0)

  return (
    <div className="space-y-3">
      {/* Search */}
      <div
        className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2"
        style={{ background: "rgba(17,19,24,0.98)" }}
      >
        <Search size={13} className="text-foreground-subtle shrink-0" />
        <input
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-subtle outline-none"
          placeholder="Rechercher une compétence…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Groups */}
      {filtered.map((group) => (
        <section
          key={group.category}
          className="rounded-xl border border-border overflow-hidden"
          style={{
            background: "rgba(17,19,24,0.98)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="text-[11px] font-medium uppercase tracking-widest text-foreground-subtle">
              {group.category}
            </h3>
            <span className="text-[10px] font-mono text-foreground-subtle">
              {group.skills.length}
            </span>
          </div>
          <ul className="divide-y divide-border">
            {group.skills.map((skill) => (
              <li
                key={skill.name}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-overlay/50 transition-colors group cursor-default"
              >
                <div className="flex items-center gap-2.5">
                  <ChevronRight
                    size={11}
                    className="text-foreground-subtle group-hover:text-foreground-muted transition-colors"
                  />
                  <span className="text-sm text-foreground-muted group-hover:text-foreground transition-colors">
                    {skill.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <RankPips rank={skill.rank} max={skill.max} />
                  <span className="font-mono text-xs text-foreground-subtle w-6 text-right">
                    {skill.rank}/{skill.max}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-foreground-subtle">
          <Search size={20} className="mb-3 opacity-40" />
          <p className="text-sm">Aucune compétence trouvée</p>
        </div>
      )}
    </div>
  )
}
