"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Sunrise, Sun, Sunset, Moon, Flag } from "lucide-react";
import { toast } from "sonner";

/**
 * Minuteur de session (cockpit MJ). Init depuis le temps live serveur
 * (`session.elapsedSeconds`) + état `running` ; tic local pour l'affichage ;
 * `onToggle` persiste start/pause, `onReset` remet le cycle à zéro.
 *
 * Rappels d'horaires : toutes les 37 min, changement de moment de la journée
 * (matin → midi → soirée → début de nuit), puis « Fin de session » au temps
 * écoulé (3 × 37 = 111 min).
 */
const MIN = 60;
const MILESTONES = [
  { at: 37 * MIN, label: "Midi", desc: "Le matin laisse place à midi." },
  { at: 74 * MIN, label: "Soirée", desc: "Midi bascule vers la soirée." },
  { at: 111 * MIN, label: "Début de nuit", desc: "La soirée glisse vers la nuit." },
];
const SESSION_END = 111 * MIN;

function moment(seconds: number) {
  const m = seconds / MIN;
  if (seconds >= SESSION_END) return { label: "Fin de session", Icon: Flag, tone: "var(--hp)" };
  if (m < 37) return { label: "Matin", Icon: Sunrise, tone: "var(--primary)" };
  if (m < 74) return { label: "Midi", Icon: Sun, tone: "var(--primary)" };
  if (m < 111) return { label: "Soirée", Icon: Sunset, tone: "var(--primary)" };
  return { label: "Début de nuit", Icon: Moon, tone: "var(--mhp)" };
}

export function SessionTimer({
  startSeconds = 0,
  running: initialRunning = true,
  onToggle,
  onReset,
  onEnd,
}: {
  startSeconds?: number;
  running?: boolean;
  onToggle?: (running: boolean) => void | Promise<void>;
  onReset?: () => void | Promise<void>;
  onEnd?: () => void | Promise<void>;
}) {
  const [seconds, setSeconds] = useState(startSeconds);
  const [running, setRunning] = useState(initialRunning);

  // Rappels déjà déclenchés (jamais re-notifiés). Init mount-only sur les
  // jalons déjà dépassés au chargement, pour ne pas toaster au montage.
  const firedRef = useRef<Set<number>>(new Set());
  const initedRef = useRef(false);
  if (!initedRef.current) {
    initedRef.current = true;
    for (const m of MILESTONES) if (startSeconds >= m.at) firedRef.current.add(m.at);
    if (startSeconds >= SESSION_END) firedRef.current.add(SESSION_END);
  }

  useEffect(() => setSeconds(startSeconds), [startSeconds]);
  useEffect(() => setRunning(initialRunning), [initialRunning]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Déclenche les rappels au passage des jalons.
  useEffect(() => {
    for (const m of MILESTONES) {
      if (seconds >= m.at && !firedRef.current.has(m.at)) {
        firedRef.current.add(m.at);
        toast(`Changement d'horaire — ${m.label}`, { description: m.desc });
      }
    }
    if (seconds >= SESSION_END && !firedRef.current.has(SESSION_END)) {
      firedRef.current.add(SESSION_END);
      toast.success("Fin de session", {
        description: "Le temps de la session est écoulé.",
      });
    }
  }, [seconds]);

  const toggle = () => {
    const next = !running;
    setRunning(next);
    void onToggle?.(next);
  };

  // Recommence le cycle depuis le début (00:00:00, matin) et relance.
  const restart = () => {
    firedRef.current = new Set();
    setSeconds(0);
    setRunning(true);
    void onReset?.();
    toast("Cycle de session relancé — Matin");
  };

  // Finir la session — 1er clic arme, 2e clic confirme. Délègue à onEnd
  // (archive les jets + vide la table des dés), puis remet le minuteur à zéro.
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  useEffect(() => {
    if (!confirmingEnd) return;
    const t = setTimeout(() => setConfirmingEnd(false), 3000);
    return () => clearTimeout(t);
  }, [confirmingEnd]);
  const end = () => {
    if (!confirmingEnd) {
      setConfirmingEnd(true);
      return;
    }
    setConfirmingEnd(false);
    setEnding(true);
    firedRef.current = new Set();
    setSeconds(0);
    setRunning(false);
    Promise.resolve(onEnd?.()).finally(() => setEnding(false));
  };

  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const mo = moment(seconds);
  const MoIcon = mo.Icon;
  // Progression vers le prochain jalon (pour la barre).
  const nextAt = MILESTONES.find((m) => seconds < m.at)?.at ?? SESSION_END;
  const prevAt = [...MILESTONES].reverse().find((m) => seconds >= m.at)?.at ?? 0;
  const pct =
    seconds >= SESSION_END
      ? 100
      : Math.min(100, ((seconds - prevAt) / (nextAt - prevAt)) * 100);

  return (
    <div className="campaign-subpanel flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <p className="eyebrow">Temps de session</p>
          <p className="font-mono text-sm tabular-nums slashed-zero text-foreground">
            {hh}:{mm}:{ss}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggle}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground"
            aria-label={running ? "Mettre en pause" : "Reprendre"}
            title={running ? "Pause" : "Reprendre"}
          >
            {running ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button
            type="button"
            onClick={restart}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground"
            aria-label="Recommencer le cycle depuis le début"
            title="Recommencer depuis le début"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Moment de la journée + progression vers le prochain changement */}
      <div className="flex items-center gap-2">
        <span
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]"
          style={{ color: mo.tone }}
        >
          <MoIcon size={12} />
          {mo.label}
        </span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${pct}%`, background: mo.tone }}
          />
        </div>
      </div>

      {onEnd && (
        <button
          type="button"
          onClick={end}
          disabled={ending}
          aria-label="Finir la session"
          className={`mt-1 flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors disabled:opacity-50 ${
            confirmingEnd
              ? "border-hp/50 bg-hp/15 text-hp"
              : "border-border text-foreground-subtle hover:bg-surface-overlay hover:text-foreground"
          }`}
        >
          <Flag size={11} />
          {ending
            ? "Clôture…"
            : confirmingEnd
              ? "Confirmer la fin ?"
              : "Finir la session"}
        </button>
      )}
    </div>
  );
}
