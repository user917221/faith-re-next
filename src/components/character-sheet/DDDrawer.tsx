"use client";

import { useEffect, useState, useTransition } from "react";
import { Dices } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Drawer latéral pour le lancer de dé avec DD.
 *
 * Un SEUL drawer global (controlled par CharacterSheet) — au lieu d'un popover
 * par skill qui flicker. Ouverture/fermeture via le state `context` du parent.
 *
 * Construit sur shadcn Sheet (Radix Dialog) côté droit : overlay, slide-in,
 * Escape et click-outside gérés nativement.
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

  const effectiveDD =
    mode === "libre" ? null : mode === "free" ? Math.max(1, Math.min(30, custom)) : dd;

  function submit() {
    startTransition(async () => {
      await onRoll(effectiveDD);
    });
  }

  return (
    <Sheet
      open={!!context}
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-[360px] max-w-[90vw] gap-0 sm:max-w-[360px]"
        aria-describedby={undefined}
      >
        {/* Header */}
        <SheetHeader className="gap-1 border-b border-border px-6 py-5">
          <p className="text-2xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Lancer de dés
          </p>
          <SheetTitle className="text-lg font-semibold tracking-tight text-foreground">
            {context?.title}
          </SheetTitle>
        </SheetHeader>

        {/* Contexte du jet */}
        <section className="border-b border-border px-6 py-4">
          <p className="text-2xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Formule
          </p>
          <p className="big-number mt-1 text-3xl text-foreground">
            2d6 <span className="text-ink-tertiary">+</span>{" "}
            <span className="text-primary">{context?.bonus}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{context?.bonusLabel}</p>
        </section>

        {/* Selector DD */}
        <section className="border-b border-border px-6 py-5">
          <p className="mb-3 text-2xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Difficulté
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DD_PRESETS.map((p) => {
              const active = mode === "preset" && dd === p.value;
              return (
                <Button
                  key={p.value}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMode("preset");
                    setDd(p.value);
                  }}
                  className={`h-auto flex-col items-start gap-0.5 px-3 py-2.5 text-left ${
                    active
                      ? "border-primary bg-primary/15 text-primary-hover hover:bg-primary/15 hover:text-primary-hover"
                      : ""
                  }`}
                >
                  <span
                    className={`text-3xs font-medium uppercase tracking-[0.06em] ${
                      active ? "text-primary-hover" : "text-muted-foreground"
                    }`}
                  >
                    {p.label}
                  </span>
                  <span
                    className={`tabular text-base font-semibold ${
                      active ? "text-primary-hover" : "text-foreground"
                    }`}
                  >
                    DD {p.value}
                  </span>
                  <span className="text-3xs font-normal text-ink-tertiary">
                    {p.desc}
                  </span>
                </Button>
              );
            })}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode("free")}
              className={`justify-start ${
                mode === "free"
                  ? "border-primary bg-primary/15 text-primary-hover hover:bg-primary/15 hover:text-primary-hover"
                  : ""
              }`}
            >
              <span className="text-3xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                DD perso
              </span>
              <span className="tabular ml-auto text-sm text-foreground">{custom}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode("libre")}
              className={`justify-start ${
                mode === "libre"
                  ? "border-primary bg-primary/15 text-primary-hover hover:bg-primary/15 hover:text-primary-hover"
                  : ""
              }`}
            >
              <span className="text-3xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Sans DD
              </span>
              <span className="ml-auto text-sm text-foreground">∞</span>
            </Button>
          </div>

          {mode === "free" && (
            <div className="mt-2 flex items-center gap-3 rounded-md border border-border bg-secondary px-3 py-2">
              <span className="text-3xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                DD ciblé
              </span>
              <Input
                type="number"
                min={1}
                max={30}
                value={custom}
                onChange={(e) =>
                  setCustom(Math.max(1, Math.min(30, parseInt(e.target.value || "0", 10) || 1)))
                }
                onFocus={(e) => e.currentTarget.select()}
                className="tabular ml-auto h-8 w-20 text-center"
              />
            </div>
          )}
        </section>

        {/* Récap final */}
        <section className="px-6 py-5">
          <p className="mb-2 text-2xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Récap
          </p>
          <p className="tabular text-sm leading-relaxed text-ink-muted">
            2d6 + <span className="text-primary">{context?.bonus}</span>
            {mode === "libre" ? (
              <span className="ml-2 text-muted-foreground">— jet sans difficulté</span>
            ) : (
              <>
                {" "}
                <span className="text-muted-foreground">contre</span>{" "}
                <span className="tabular text-primary-hover">DD {effectiveDD}</span>
              </>
            )}
          </p>

          <Button
            type="button"
            onClick={submit}
            disabled={isPending}
            size="lg"
            className="mt-5 w-full"
          >
            <Dices className="size-4" />
            {isPending ? "Lancement…" : "Lancer les dés"}
          </Button>

          <p className="mt-3 text-center text-2xs text-ink-tertiary">
            Le résultat apparaîtra dans le carnet du plateau.
          </p>
        </section>
      </SheetContent>
    </Sheet>
  );
}
