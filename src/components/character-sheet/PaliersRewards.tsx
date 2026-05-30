"use client";

/**
 * PaliersRewards — récompenses des paliers d'Endurance & de Flux (Phase retours).
 * Visible par TOUS (joueurs + MJ) : montre ce que CHAQUE palier débloque
 * (jauge max + catégorie de sorts), SANS révéler comment l'atteindre
 * (entraînements / combats — ça reste dans l'onglet Évolution, privé MJ).
 */
import {
  ENDURANCE_TIERS,
  FLUX_TIERS,
  SPELL_CATEGORIES,
  getEnduranceTier,
  getFluxTier,
} from "@/lib/faith-system";
import type { Character } from "./types";

function spellFor(palier: number): string | null {
  return SPELL_CATEGORIES.find((c) => c.minPalier === palier)?.name ?? null;
}

export function PaliersRewards({ character }: { character: Character }) {
  const curEndu = getEnduranceTier(character.enduranceTrainings).label;
  const curFluxPalier = getFluxTier(
    character.fluxTrainings,
    character.combatsReal,
  ).palier;

  const enduAsc = [...ENDURANCE_TIERS].reverse(); // bas → haut
  const fluxAsc = [...FLUX_TIERS].reverse();

  return (
    <section className="campaign-panel">
      <header className="campaign-header-line flex items-center justify-between px-5 py-3">
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
          Paliers — récompenses
        </h2>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle">
          ce que débloque chaque palier
        </span>
      </header>

      <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
        {/* Endurance */}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-endu">
            Endurance
          </p>
          <div className="flex flex-col gap-1">
            {enduAsc.map((t) => {
              const active = t.label === curEndu;
              return (
                <div
                  key={t.label}
                  className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
                    active
                      ? "border-endu/40 bg-endu/10"
                      : "border-transparent"
                  }`}
                >
                  <span className={active ? "font-medium text-foreground" : "text-foreground-muted"}>
                    {t.label}
                  </span>
                  <span className="font-mono tabular-nums slashed-zero text-foreground-muted">
                    {t.max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flux */}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
            Flux
          </p>
          <div className="flex flex-col gap-1">
            {fluxAsc.map((t) => {
              const active = t.palier === curFluxPalier;
              const spell = spellFor(t.palier);
              return (
                <div
                  key={t.label}
                  className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
                    active ? "border-primary/40 bg-primary/10" : "border-transparent"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={`font-mono ${active ? "font-medium text-foreground" : "text-foreground-muted"}`}
                    >
                      {t.label}
                    </span>
                    {spell && (
                      <span className="truncate text-foreground-subtle">{spell}</span>
                    )}
                  </span>
                  <span className="font-mono tabular-nums slashed-zero text-foreground-muted">
                    {t.max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
