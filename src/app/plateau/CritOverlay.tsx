"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Overlay full-screen pour les crits — Linear sobre mais impactant.
 *
 * Compare le dernier roll reçu avec le précédent (par id). Si nouveau crit,
 * affiche une animation 2.5s puis se cache.
 *
 * Voile sobre bg-background/70 (pas de halo/bloom — Linear plat), impact par la typo.
 *  - Réussite critique (✦) : titre lavande/primary (#5e6ad2) + sigil tournant
 *  - Échec catastrophique  : titre hp (#e5484d) tremblant (shake) + sigil ⚜ inversé
 *
 * Pas de son. Plein écran z-[60], au-dessus de tout.
 */

type RollPing = {
  id: string;
  isCritSucc: boolean;
  isCritFail: boolean;
};

type Mode = "succ" | "fail" | null;

export function CritOverlay({ latestRoll }: { latestRoll: RollPing | null }) {
  const [mode, setMode] = useState<Mode>(null);
  const seenId = useRef<string | null>(null);

  useEffect(() => {
    if (!latestRoll) return;
    // 1er render : on note l'id sans déclencher d'animation (le crit éventuel
    // a déjà été joué dans une session précédente).
    if (seenId.current === null) {
      seenId.current = latestRoll.id;
      return;
    }
    if (latestRoll.id === seenId.current) return;
    seenId.current = latestRoll.id;
    if (latestRoll.isCritSucc) setMode("succ");
    else if (latestRoll.isCritFail) setMode("fail");
  }, [latestRoll]);

  useEffect(() => {
    if (!mode) return;
    const t = setTimeout(() => setMode(null), 2500);
    return () => clearTimeout(t);
  }, [mode]);

  if (!mode) return null;

  if (mode === "succ") {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70"
        style={{ animation: "crit-overlay-fade 2.5s ease-in-out forwards" }}
        aria-hidden
      >
        <div className="relative flex flex-col items-center gap-6 px-4 text-center">
          <span
            className="text-6xl text-primary-hover opacity-0 sm:text-7xl"
            style={{ animation: "crit-sigil-spin 1.4s ease-out forwards" }}
          >
            ✦
          </span>
          <h1
            className="text-5xl font-semibold uppercase tracking-tight text-primary-hover sm:text-7xl"
            style={{ animation: "crit-text-rise 2.4s ease-out forwards" }}
          >
            Réussite critique
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70"
      style={{ animation: "crit-overlay-fade 2.5s ease-in-out forwards" }}
      aria-hidden
    >
      <div className="relative flex flex-col items-center gap-6 px-4 text-center">
        <h1
          className="text-4xl font-semibold uppercase tracking-tight text-hp italic sm:text-6xl"
          style={{
            animation:
              "crit-text-rise 2.4s ease-out forwards, crit-shake 0.5s ease-in-out 2",
          }}
        >
          Échec catastrophique
        </h1>
        <p
          className="text-[0.78rem] uppercase tracking-[0.18em] text-muted-foreground italic opacity-0"
          style={{ animation: "crit-text-rise 2.4s ease-out 0.25s forwards" }}
        >
          L&apos;Impôt Divin réclame son dû.
        </p>
        <span
          className="text-6xl text-hp opacity-0"
          style={{
            animation: "crit-sigil-spin 1.4s ease-out forwards",
            transform: "rotate(180deg)",
          }}
        >
          ⚜
        </span>
      </div>
    </div>
  );
}
