"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Overlay full-screen pour les crits.
 *
 * Compare le dernier roll reçu avec le précédent (par id). Si nouveau crit,
 * affiche une animation 2.5s puis se cache.
 *
 *  - Réussite critique (✦) : radial gold-aged + grand titre + sigil tournant
 *  - Échec catastrophique  : radial blood-deep + titre tremblant + sigil ⚜ inversé
 *
 * Pas de son.
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
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{ animation: "crit-overlay-fade 2.5s ease-in-out forwards" }}
        aria-hidden
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(202,161,90,0.35) 0%, rgba(202,161,90,0.0) 60%)",
            animation: "crit-glow-expand 1.2s ease-out forwards",
          }}
        />
        <div className="relative flex flex-col items-center gap-6 px-4 text-center">
          <span
            className="font-display text-7xl text-gold-bright opacity-0"
            style={{
              animation: "crit-sigil-spin 1.4s ease-out forwards",
              textShadow:
                "0 0 30px rgba(232, 192, 116, 0.6), 0 0 60px rgba(202,161,90,0.35)",
            }}
          >
            ✦
          </span>
          <h1
            className="font-display text-5xl uppercase tracking-[0.18em] text-gold-bright sm:text-7xl"
            style={{
              animation: "crit-text-rise 2.4s ease-out forwards",
              textShadow:
                "0 0 28px rgba(232, 192, 116, 0.65), 0 0 64px rgba(202,161,90,0.45)",
            }}
          >
            Réussite critique
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ animation: "crit-overlay-fade 2.5s ease-in-out forwards" }}
      aria-hidden
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(122,58,58,0.4) 0%, rgba(122,58,58,0) 65%)",
          animation: "crit-glow-expand 1.2s ease-out forwards",
        }}
      />
      <div className="relative flex flex-col items-center gap-6 px-4 text-center">
        <h1
          className="font-display text-4xl italic uppercase tracking-[0.16em] text-blood-dried sm:text-6xl"
          style={{
            animation:
              "crit-text-rise 2.4s ease-out forwards, crit-shake 0.5s ease-in-out 2",
          }}
        >
          Échec catastrophique
        </h1>
        <p
          className="font-display text-[0.78rem] italic uppercase tracking-[0.22em] text-parchment-mute opacity-0"
          style={{ animation: "crit-text-rise 2.4s ease-out 0.25s forwards" }}
        >
          L&apos;Impôt Divin réclame son dû.
        </p>
        <span
          className="font-display text-6xl text-blood-dried opacity-0"
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
