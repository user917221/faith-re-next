"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

/**
 * Minuteur de séance (cockpit MJ). Phase 5 : initialisé depuis le temps live
 * serveur (`session.elapsedSeconds`) + état `running`. Tic local pour l'affichage ;
 * `onToggle` persiste start/pause côté serveur.
 */
export function SessionTimer({
  startSeconds = 13338,
  running: initialRunning = true,
  onToggle,
}: {
  startSeconds?: number;
  running?: boolean;
  onToggle?: (running: boolean) => void | Promise<void>;
}) {
  const [seconds, setSeconds] = useState(startSeconds);
  const [running, setRunning] = useState(initialRunning);

  // Resynchronise sur les valeurs serveur après un refresh.
  useEffect(() => setSeconds(startSeconds), [startSeconds]);
  useEffect(() => setRunning(initialRunning), [initialRunning]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const toggle = () => {
    const next = !running;
    setRunning(next); // optimiste
    void onToggle?.(next);
  };

  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="campaign-subpanel flex items-center justify-between gap-2 p-3">
      <div className="flex flex-col">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-foreground-subtle">
          Temps de séance
        </p>
        <p className="font-mono text-sm tabular-nums slashed-zero text-foreground">
          {hh}:{mm}:{ss}
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground"
        aria-label={running ? "Mettre en pause" : "Reprendre"}
      >
        {running ? <Pause size={13} /> : <Play size={13} />}
      </button>
    </div>
  );
}
