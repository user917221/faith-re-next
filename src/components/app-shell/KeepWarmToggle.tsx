"use client";

import { useEffect, useRef, useState } from "react";
import { Power } from "lucide-react";

/**
 * KeepWarmToggle — bouton « Allumer la table ».
 *
 * Anti-cold-start Neon : tant que c'est allumé, ping `/api/ping` toutes les
 * 4 min (sous le seuil de mise en veille Neon ~5 min) pour garder la base
 * réveillée pendant qu'un joueur est connecté. S'éteint tout seul après 1 h
 * sans activité (souris/clavier/clic/scroll). L'état est mémorisé en
 * localStorage (survit aux rechargements).
 */
const PING_INTERVAL = 4 * 60 * 1000; // 4 min
const IDLE_TIMEOUT = 60 * 60 * 1000; // 1 h sans activité → extinction auto
const LS_KEY = "faith-keepwarm";

export function KeepWarmToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(false);
  const [warm, setWarm] = useState(false);
  const lastActivity = useRef(0);

  // Restaure l'état au montage.
  useEffect(() => {
    if (localStorage.getItem(LS_KEY) === "1") {
      lastActivity.current = Date.now();
      setOn(true);
    }
  }, []);

  // Suivi d'activité — réarme le minuteur d'inactivité.
  useEffect(() => {
    if (!on) return;
    const bump = () => {
      lastActivity.current = Date.now();
    };
    const evts = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    evts.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    return () => evts.forEach((e) => window.removeEventListener(e, bump));
  }, [on]);

  // Boucle de ping + coupure après 1 h d'inactivité.
  useEffect(() => {
    if (!on) {
      setWarm(false);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      if (Date.now() - lastActivity.current > IDLE_TIMEOUT) {
        localStorage.setItem(LS_KEY, "0");
        setOn(false);
        return;
      }
      try {
        const r = await fetch("/api/ping", { cache: "no-store" });
        if (!cancelled) setWarm(r.ok);
      } catch {
        if (!cancelled) setWarm(false);
      }
    };
    tick(); // réveille immédiatement au clic
    const id = setInterval(tick, PING_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [on]);

  const toggle = () => {
    const next = !on;
    localStorage.setItem(LS_KEY, next ? "1" : "0");
    if (next) lastActivity.current = Date.now();
    setOn(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title={
        on
          ? "Table allumée — la base reste réveillée (anti-lenteur). S'éteint après 1 h sans activité."
          : "Allumer la table — garde la base de données réveillée pour éviter la lenteur au démarrage."
      }
      className={`flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs transition-colors ${
        on
          ? "border-endu/40 bg-endu/10 text-endu hover:bg-endu/15"
          : "border-border bg-card/80 text-foreground-muted hover:border-hairline-strong hover:bg-surface-overlay hover:text-foreground"
      } ${className}`}
    >
      <span
        className={`inline-block size-2 rounded-full ${
          on
            ? warm
              ? "bg-endu"
              : "bg-endu/50 animate-pulse"
            : "bg-foreground-subtle/50"
        }`}
        aria-hidden
      />
      <Power className="size-3.5" />
      <span className="hidden sm:inline">
        {on ? "Table allumée" : "Allumer la table"}
      </span>
    </button>
  );
}
