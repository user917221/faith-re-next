"use client";

import { useState, useTransition } from "react";
import { Dices, X } from "lucide-react";

/**
 * Lanceur de dés (cockpit MJ) — un seul type de jet : le **Pool de Dés**.
 * Dés disponibles : d6 / d8 / d50 / d100. Modificateur plat optionnel.
 *
 * Contrôlé : si `onRoll` est fourni (cockpit /mj réel → `rollPublicPool`), le
 * jet est persisté et apparaît sur /plateau. Sinon, fallback local (Math.random).
 */
const DICE = [6, 8, 50, 100];

type PoolDie = { sides: number; count: number };
type RollInput = { dice: PoolDie[]; modifier: number; keep: "all" | "highest" | "lowest" };
type RollResult = { total: number; isCritSucc: boolean; isCritFail: boolean };
type Display = { total: number; crit: "succ" | "fail" | null; label: string };

const d = (sides: number) => 1 + Math.floor(Math.random() * sides);

function localRoll({ dice, modifier }: RollInput): RollResult {
  const flat = dice.flatMap((g) => Array<number>(g.count).fill(g.sides));
  const rolls = flat.map((s) => d(s));
  const total = rolls.reduce((a, b) => a + b, 0) + modifier;
  const isCritSucc = flat.length === 1 && rolls[0] === flat[0];
  const isCritFail = flat.length === 1 && rolls[0] === 1;
  return { total, isCritSucc, isCritFail };
}

export function QuickRollPanel({
  characterName,
  onRoll,
}: {
  characterName?: string;
  onRoll?: (input: RollInput) => Promise<RollResult | null>;
} = {}) {
  const [mods, setMods] = useState(0);
  const [pool, setPool] = useState<PoolDie[]>([
    { sides: 6, count: 2 },
    { sides: 8, count: 1 },
  ]);
  const [display, setDisplay] = useState<Display | null>(null);
  const [isPending, startTransition] = useTransition();

  const modLabel = mods ? ` ${mods > 0 ? "+" : "−"}${Math.abs(mods)}` : "";

  const rollPool = () => {
    if (pool.length === 0) return;
    const input: RollInput = { dice: pool, modifier: mods, keep: "all" };
    const label = pool.map((p) => `${p.count}d${p.sides}`).join(" + ") + modLabel;
    startTransition(async () => {
      const res = onRoll ? await onRoll(input) : localRoll(input);
      if (!res) return;
      setDisplay({
        total: res.total,
        crit: res.isCritSucc ? "succ" : res.isCritFail ? "fail" : null,
        label,
      });
    });
  };

  const critColor =
    display?.crit === "succ"
      ? "var(--endu)"
      : display?.crit === "fail"
        ? "var(--hp)"
        : "var(--foreground)";

  return (
    <div className="flex flex-col gap-3">
      {/* Résultat */}
      <section className="campaign-panel">
        <div className="campaign-header-line flex items-center justify-between px-4 py-3">
          <h2 className="min-w-0 truncate font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
            Pool de dés
            {characterName && (
              <span className="ml-1.5 normal-case tracking-normal text-foreground-muted">
                · {characterName}
              </span>
            )}
          </h2>
        </div>
        <div className="flex flex-col items-center gap-1 px-4 py-5">
          <span
            className="font-mono text-5xl font-semibold leading-none tabular-nums slashed-zero transition-colors"
            style={{ color: critColor }}
          >
            {display?.total ?? "—"}
          </span>
          <span className="mt-1 min-h-3.5 font-mono text-[10px] uppercase tracking-widest text-foreground-subtle">
            {display
              ? display.crit === "succ"
                ? `Crit ! · ${display.label}`
                : display.crit === "fail"
                  ? `Échec critique · ${display.label}`
                  : `Jet ${display.label}`
              : "Construis ton pool de dés"}
          </span>
        </div>
      </section>

      {/* Modificateurs */}
      <section className="campaign-panel p-4">
        <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
          Modificateurs
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <ModBtn
              key={`p${n}`}
              label={`+${n}`}
              active={mods === n}
              onClick={() => setMods(mods === n ? 0 : n)}
            />
          ))}
          {[1, 2, 3, 4, 5].map((n) => (
            <ModBtn
              key={`m${n}`}
              label={`−${n}`}
              active={mods === -n}
              onClick={() => setMods(mods === -n ? 0 : -n)}
            />
          ))}
        </div>
      </section>

      {/* Pool de dés */}
      <section className="campaign-panel p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
            Pool de dés
          </p>
          <button
            type="button"
            onClick={() => setPool((p) => [...p, { sides: 6, count: 1 }])}
            className="font-mono text-[10px] text-foreground-muted transition-colors hover:text-foreground"
          >
            + Dé
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {pool.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={p.sides}
                onChange={(e) =>
                  setPool((pl) =>
                    pl.map((x, j) => (j === i ? { ...x, sides: +e.target.value } : x)),
                  )
                }
                aria-label="Face du dé"
                className="rounded-md border border-border bg-background/40 px-1.5 py-1 font-mono text-[11px] text-foreground-muted outline-none"
              >
                {DICE.map((n) => (
                  <option key={n} value={n}>
                    d{n}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={p.count}
                onChange={(e) =>
                  setPool((pl) =>
                    pl.map((x, j) =>
                      j === i ? { ...x, count: Math.max(1, +e.target.value || 1) } : x,
                    ),
                  )
                }
                aria-label="Nombre de dés"
                className="h-7 w-12 rounded-md border border-border bg-background/40 text-center font-mono text-[11px] tabular-nums text-foreground-muted outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setPool((pl) => pl.filter((_, j) => j !== i))}
                aria-label="Retirer"
                className="ml-auto text-foreground-subtle transition-colors hover:text-hp"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={rollPool}
          disabled={isPending || pool.length === 0}
          className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-foreground text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          <Dices size={14} /> Lancer le pool
        </button>
      </section>
    </div>
  );
}

function ModBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-md border font-mono text-[11px] tabular-nums transition-colors ${
        active
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-border text-foreground-muted hover:bg-surface-overlay hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
