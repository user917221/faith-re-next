/**
 * RulesView — référence des règles FAITH:RE (Phase 7). Contenu statique,
 * dérivé des constantes système (skills.ts + faith-system.ts). Pas de BDD.
 */
import { Scale } from "lucide-react";
import { SKILL_GROUPS, SKILL_TIERS } from "@/lib/skills";
import {
  ENDURANCE_TIERS,
  FLUX_TIERS,
  ENDURANCE_COSTS,
  SPELL_CATEGORIES,
} from "@/lib/faith-system";

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="campaign-panel">
      <header className="campaign-header-line px-5 py-3">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
          {title}
        </h2>
      </header>
      <div className="p-5 text-sm text-foreground-muted">{children}</div>
    </section>
  );
}

export function RulesView() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex items-center gap-2.5">
        <Scale size={18} className="text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Règles — FAITH:RE</h1>
      </header>

      <Panel title="Jets de dés">
        <p>
          Jet de base :{" "}
          <span className="font-mono text-foreground">2d6 + attribut + compétence</span>{" "}
          contre une difficulté (DD).
        </p>
        <ul className="mt-2 list-disc pl-5">
          <li>Le score d&apos;attribut = somme des 5 compétences de l&apos;attribut.</li>
          <li>
            <span className="font-mono text-foreground">Double 6</span> = réussite
            critique (force le succès).
          </li>
          <li>
            <span className="font-mono text-foreground">Double 1</span> = échec
            critique (force l&apos;échec).
          </li>
        </ul>
      </Panel>

      <Panel title="Attributs & compétences">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(Object.keys(SKILL_GROUPS) as (keyof typeof SKILL_GROUPS)[]).map(
            (attr) => (
              <div key={attr}>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-foreground">
                  {attr}
                </p>
                <ul className="mt-1 text-xs">
                  {SKILL_GROUPS[attr].map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      </Panel>

      <Panel title="Paliers de compétence">
        <div className="flex flex-wrap gap-2">
          {SKILL_TIERS.map((t) => (
            <span
              key={t.key}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
              style={{
                background: `rgba(${t.rgb},0.1)`,
                border: `1px solid rgba(${t.rgb},0.28)`,
                color: `rgb(${t.rgb})`,
              }}
            >
              {t.label}
              <span className="font-mono tabular-nums opacity-80">{t.range}</span>
            </span>
          ))}
        </div>
      </Panel>

      <Panel title="Endurance — coûts d'action">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs sm:grid-cols-2">
          {Object.values(ENDURANCE_COSTS).map((c) => (
            <div key={c.label} className="flex justify-between gap-2">
              <span className="text-foreground-muted">{c.label}</span>
              <span className="tabular-nums text-foreground">−{c.cost}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
          Paliers d&apos;endurance
        </p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {[...ENDURANCE_TIERS].reverse().map((t) => (
            <span key={t.label}>
              {t.label}{" "}
              <span className="font-mono tabular-nums text-foreground">{t.max}</span>
            </span>
          ))}
        </div>
      </Panel>

      <Panel title="Flux — paliers & sorts">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {[...FLUX_TIERS].reverse().map((t) => (
            <span key={t.label}>
              <span className="font-mono text-foreground">{t.label}</span> max{" "}
              <span className="font-mono tabular-nums text-foreground">{t.max}</span>{" "}
              <span className="text-foreground-subtle">
                ({t.fluxTrainings} entr. / {t.combats} combats)
              </span>
            </span>
          ))}
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
          Catégories de sorts
        </p>
        <div className="mt-1 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
          {SPELL_CATEGORIES.map((s) => (
            <div key={s.name} className="flex justify-between gap-2">
              <span className="text-foreground-muted">
                {s.name} <span className="text-foreground-subtle">(P{s.minPalier}+)</span>
              </span>
              <span className="font-mono tabular-nums text-foreground">{s.cost}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
