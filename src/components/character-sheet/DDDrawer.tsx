"use client";

import { useEffect, useState, useTransition } from "react";

/**
 * Drawer latéral pour le lancer de dé avec DD.
 *
 * Un SEUL drawer global (controlled par CharacterSheet) — au lieu d'un popover
 * par skill qui flicker. Ouverture/fermeture via le state `context` du parent.
 *
 * Slide-in depuis la droite, w-[360px], backdrop semi-opaque, click outside +
 * Escape pour fermer.
 */

const DD_PRESETS = [
  { label: "Facile", value: 6, desc: "Le bon sens suffit" },
  { label: "Normal", value: 8, desc: "Une stat entraînée" },
  { label: "Difficile", value: 11, desc: "Demande de l'effort" },
  { label: "Héroïque", value: 14, desc: "Au-delà du normal" },
  { label: "Impossible", value: 18, desc: "Seul un miracle…" },
] as const;

export type RollContext = {
  /** Titre affiché en haut "Jet de [title]" */
  title: string;
  /** Score qui sera additionné aux 2d6 — pour le preview */
  bonus: number;
  /** Texte du bonus pour preview (ex: "INTELLECT + Encyclopédie") */
  bonusLabel: string;
};

type Props = {
  context: RollContext | null;
  onClose: () => void;
  onRoll: (dd: number | null) => Promise<void>;
};

export function DDDrawer({ context, onClose, onRoll }: Props) {
  const [dd, setDd] = useState<number | null>(8);
  const [custom, setCustom] = useState<number>(10);
  const [mode, setMode] = useState<"preset" | "free" | "libre">("preset");
  const [isPending, startTransition] = useTransition();

  // Reset state à chaque ouverture
  useEffect(() => {
    if (context) {
      setMode("preset");
      setDd(8);
      setCustom(10);
    }
  }, [context]);

  // Escape pour fermer
  useEffect(() => {
    if (!context) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [context, isPending, onClose]);

  if (!context) return null;

  const effectiveDD =
    mode === "libre" ? null : mode === "free" ? Math.max(1, Math.min(30, custom)) : dd;

  function submit() {
    startTransition(async () => {
      await onRoll(effectiveDD);
    });
  }

  return (
    <>
      {/* Backdrop — clic ferme */}
      <div
        className="fixed inset-0 z-40 bg-ink-deep/55 backdrop-blur-[2px] animate-[crit-overlay-fade_0.2s_ease-out]"
        onClick={() => !isPending && onClose()}
        aria-hidden
      />

      {/* Panel slide-in droite */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Lancer de dés pour ${context.title}`}
        className="fixed right-0 top-0 z-50 h-full w-[360px] max-w-[90vw] border-l border-gold-aged/25 bg-ink-near shadow-[-24px_0_60px_-12px_rgba(0,0,0,0.7),inset_1px_0_0_rgba(202,161,90,0.08)] animate-[drawer-slide_0.28s_cubic-bezier(0.16,1,0.3,1)]"
      >
        {/* Couture dorée intérieure */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-px"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(202,161,90,0.6) 50%, transparent 100%)",
          }}
          aria-hidden
        />

        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-gold-aged/12 px-6 py-5">
          <div>
            <p className="label-grimoire">Lancer de dés</p>
            <h2 className="font-display mt-1 text-xl tracking-wide text-gold-aged">
              {context.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Fermer"
            className="focus-grimoire flex h-8 w-8 items-center justify-center rounded-[--radius-xs] border border-gold-aged/15 text-parchment-mute transition-colors hover:border-gold-aged/40 hover:text-gold-aged disabled:opacity-40"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M3 3 L 13 13 M 13 3 L 3 13" />
            </svg>
          </button>
        </header>

        {/* Contexte du jet */}
        <section className="border-b border-gold-aged/8 px-6 py-4">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-parchment-mute">
            Formule
          </p>
          <p className="font-display tabular mt-1 text-2xl text-parchment">
            2d6 <span className="text-gold-soft">+</span>{" "}
            <span className="text-gold-aged">{context.bonus}</span>
          </p>
          <p className="mt-0.5 text-[0.7rem] text-parchment-mute">
            ↑ {context.bonusLabel}
          </p>
        </section>

        {/* Selector DD */}
        <section className="border-b border-gold-aged/8 px-6 py-5">
          <p className="label-grimoire mb-3">Difficulté</p>
          <div className="grid grid-cols-2 gap-2">
            {DD_PRESETS.map((p) => {
              const active = mode === "preset" && dd === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setMode("preset");
                    setDd(p.value);
                  }}
                  className={`focus-grimoire flex flex-col items-start gap-0.5 rounded-[--radius-sm] border px-3 py-2.5 text-left transition-all ${
                    active
                      ? "dd-chip-active translate-y-[-1px]"
                      : "border-gold-aged/12 hover:translate-y-[-1px] hover:border-gold-aged/35"
                  }`}
                >
                  <span className={`font-display text-[0.62rem] uppercase tracking-[0.15em] ${active ? "text-gold-bright" : "text-parchment-dim"}`}>
                    {p.label}
                  </span>
                  <span className={`tabular text-base ${active ? "text-gold-bright" : "text-parchment"}`}>
                    DD {p.value}
                  </span>
                  <span className="text-[0.6rem] italic text-parchment-mute">
                    {p.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("free")}
              className={`focus-grimoire flex items-center gap-2 rounded-[--radius-sm] border px-3 py-2 transition-all ${
                mode === "free"
                  ? "dd-chip-active"
                  : "border-gold-aged/12 hover:border-gold-aged/35"
              }`}
            >
              <span className="font-display text-[0.62rem] uppercase tracking-[0.15em] text-parchment-dim">
                DD perso
              </span>
              <span className="tabular ml-auto text-sm text-gold-aged">{custom}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("libre")}
              className={`focus-grimoire flex items-center gap-2 rounded-[--radius-sm] border px-3 py-2 transition-all ${
                mode === "libre"
                  ? "dd-chip-active"
                  : "border-gold-aged/12 hover:border-gold-aged/35"
              }`}
            >
              <span className="font-display text-[0.62rem] uppercase tracking-[0.15em] text-parchment-dim">
                Sans DD
              </span>
              <span className="ml-auto text-sm text-gold-aged">∞</span>
            </button>
          </div>

          {mode === "free" && (
            <div className="mt-3 flex items-center gap-3 rounded-[--radius-sm] border border-gold-aged/12 bg-ink-deep px-3 py-2">
              <span className="font-display text-[0.62rem] uppercase tracking-[0.15em] text-parchment-mute">
                DD ciblé
              </span>
              <input
                type="number"
                min={1}
                max={30}
                value={custom}
                onChange={(e) =>
                  setCustom(Math.max(1, Math.min(30, parseInt(e.target.value || "0", 10) || 1)))
                }
                onFocus={(e) => e.currentTarget.select()}
                className="tabular ml-auto h-8 w-20 rounded-[--radius-xs] border border-gold-aged/20 bg-ink-near px-2 text-center text-sm text-parchment outline-none focus-visible:border-gold-aged/55"
              />
            </div>
          )}
        </section>

        {/* Récap final */}
        <section className="px-6 py-5">
          <p className="label-grimoire mb-2">Récap</p>
          <p className="tabular text-sm leading-relaxed text-parchment-dim">
            2d6 + <span className="text-gold-aged">{context.bonus}</span>
            {mode === "libre" ? (
              <span className="ml-2 italic text-parchment-mute">
                — jet sans difficulté
              </span>
            ) : (
              <>
                {" "}
                <span className="text-parchment-mute">contre</span>{" "}
                <span className="tabular text-gold-bright">DD {effectiveDD}</span>
              </>
            )}
          </p>

          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="btn-grimoire mt-5 w-full text-sm tracking-[0.14em]"
          >
            {isPending ? "Lancement…" : "✦ Lancer les dés"}
          </button>

          <p className="mt-3 text-center text-[0.65rem] italic text-parchment-mute">
            Le résultat apparaîtra dans le carnet du plateau.
          </p>
        </section>
      </aside>
    </>
  );
}
