"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

/** Minuteur de session (cockpit MJ). Phase 1 : local ; persisté `session.elapsedSeconds` en Phase 5. */
export function SessionTimer({ startSeconds = 13338 }: { startSeconds?: number }) {
  const [seconds, setSeconds] = useState(startSeconds);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="campaign-subpanel flex items-center justify-between gap-2 p-3">
      <div className="flex flex-col">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-foreground-subtle">
          Temps de session
        </p>
        <p className="font-mono text-sm tabular-nums slashed-zero text-foreground">
          {hh}:{mm}:{ss}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground"
        aria-label={running ? "Mettre en pause" : "Reprendre"}
      >
        {running ? <Pause size={13} /> : <Play size={13} />}
      </button>
    </div>
  );
}
