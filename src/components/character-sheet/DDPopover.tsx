"use client";

import { useEffect, useRef, useState, useTransition } from "react";

/**
 * Popover de lancer de dé avec sélection de difficulté.
 *
 * Utilisé sur les skills ET les badges d'attributs de la fiche. Ouverture au
 * click du bouton trigger, fermeture au click outside / Escape / après roll.
 *
 * Le composant délègue le calcul au callback `onRoll({ dd })`. Le caller
 * connaît déjà l'attribut / le skill ; il n'a qu'à appliquer le DD choisi.
 */

const DD_PRESETS = [
  { label: "Facile", value: 6 },
  { label: "Normal", value: 8 },
  { label: "Difficile", value: 11 },
  { label: "Héroïque", value: 14 },
  { label: "Impossible", value: 18 },
] as const;

type Props = {
  /** Label affiché en haut "Jet de [title]" */
  title: string;
  /** Score qui sera additionné aux 2d6 — pour le preview */
  bonus: number;
  /** Texte du bonus pour preview ("INTELLECT" ou "Sang-Froid" etc.) */
  bonusLabel: string;
  /** Trigger button — fourni par le parent (gros bouton dés, petit bouton inline...) */
  trigger: React.ReactNode;
  /** Lancement effectif (server action) */
  onRoll: (dd: number | null) => Promise<void>;
  /** Alignement du popover par rapport au trigger (default right) */
  align?: "left" | "right";
};

export function DDPopover({ title, bonus, bonusLabel, trigger, onRoll, align = "right" }: Props) {
  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState<number | null>(8);
  const [custom, setCustom] = useState<number>(10);
  const [mode, setMode] = useState<"preset" | "free" | "libre">("preset");
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  // Click outside + Escape
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (e.target instanceof Node && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const effectiveDD =
    mode === "libre" ? null : mode === "free" ? Math.max(1, Math.min(30, custom)) : dd;

  function submit() {
    startTransition(async () => {
      await onRoll(effectiveDD);
      setOpen(false);
    });
  }

  return (
    <div ref={ref} className="relative inline-flex">
      <span onClick={() => setOpen((o) => !o)} role="button" tabIndex={-1} className="inline-flex">
        {trigger}
      </span>
      {open && (
        <div
          className={`popover-rise absolute top-full z-30 mt-2 w-[300px] rounded-[--radius-md] border border-gold-aged/30 bg-ink-near p-3.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <p className="font-display text-[0.78rem] tracking-[0.06em] text-gold-aged">
            Jet de <span className="text-gold-bright">{title}</span>
          </p>
          <p className="mt-0.5 text-[0.68rem] text-parchment-mute">
            2d6 + {bonusLabel} (<span className="tabular text-gold-aged">{bonus}</span>)
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
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
                  className={`focus-grimoire flex flex-col items-center rounded-[--radius-xs] border px-2 py-1 transition-colors ${
                    active
                      ? "dd-chip-active"
                      : "border-gold-aged/15 text-parchment-dim hover:border-gold-aged/35 hover:text-parchment"
                  }`}
                >
                  <span className="font-display text-[0.58rem] uppercase tracking-[0.12em]">
                    {p.label}
                  </span>
                  <span className="tabular text-[0.78rem]">{p.value}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMode("free")}
              className={`focus-grimoire flex flex-col items-center rounded-[--radius-xs] border px-2 py-1 transition-colors ${
                mode === "free"
                  ? "dd-chip-active"
                  : "border-gold-aged/15 text-parchment-dim hover:border-gold-aged/35 hover:text-parchment"
              }`}
            >
              <span className="font-display text-[0.58rem] uppercase tracking-[0.12em]">DD</span>
              <span className="tabular text-[0.78rem]">{custom}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("libre")}
              className={`focus-grimoire flex flex-col items-center rounded-[--radius-xs] border px-2 py-1 transition-colors ${
                mode === "libre"
                  ? "dd-chip-active"
                  : "border-gold-aged/15 text-parchment-dim hover:border-gold-aged/35 hover:text-parchment"
              }`}
            >
              <span className="font-display text-[0.58rem] uppercase tracking-[0.12em]">
                Libre
              </span>
              <span className="text-[0.78rem]">∞</span>
            </button>
          </div>

          {mode === "free" && (
            <div className="mt-2.5 flex items-center gap-2">
              <span className="font-display text-[0.62rem] uppercase tracking-[0.14em] text-parchment-mute">
                DD perso
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
                className="tabular h-7 w-16 rounded-[--radius-xs] border border-gold-aged/18 bg-ink-deep px-2 text-center text-[0.85rem] text-parchment outline-none focus-visible:border-gold-aged/45"
              />
            </div>
          )}

          <div className="mt-3 rounded-[--radius-xs] border border-gold-aged/12 bg-ink-deep px-2.5 py-1.5">
            <p className="tabular text-[0.7rem] text-parchment-dim">
              2d6 + <span className="text-gold-aged">{bonus}</span>
              {mode === "libre" ? (
                <span className="ml-2 text-parchment-mute">— sans difficulté</span>
              ) : (
                <span className="ml-2 text-parchment-mute">
                  vs <span className="tabular text-gold-bright">DD {effectiveDD}</span>
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="btn-grimoire mt-3 w-full"
          >
            {isPending ? "Lancement…" : `Lancer 2d6 + ${bonus}`}
          </button>
        </div>
      )}
    </div>
  );
}
