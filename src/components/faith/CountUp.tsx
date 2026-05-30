"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * Compteur animé léger (geste Omen) — anime de la valeur précédente vers la
 * nouvelle en ~450 ms (easeOutQuart), via requestAnimationFrame.
 * Respecte `prefers-reduced-motion`. SSR-safe : rend la valeur telle quelle au
 * premier render (pas de mismatch d'hydratation).
 */
export function CountUp({
  value,
  durationMs = 450,
  className,
  style,
}: {
  value: number;
  durationMs?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) {
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      fromRef.current = to;
      rafRef.current = requestAnimationFrame(() => setDisplay(to));
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / durationMs);
      const current = Math.round(from + (to - from) * easeOutQuart(t));
      setDisplay(current);
      fromRef.current = current;
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs]);

  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
}
