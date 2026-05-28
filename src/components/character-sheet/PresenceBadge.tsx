"use client";

import { useTransition } from "react";

/**
 * Statut de présence à la table. Toggle isPresent du perso.
 *
 * - ON  : LED celadon pulse + label "Présent à la table" + bouton ghost "Quitter"
 * - OFF : LED parchment-mute statique + label "Absent" + bouton primaire "Rejoindre"
 */
type Props = {
  isPresent: boolean;
  onToggle: () => Promise<void>;
};

export function PresenceBadge({ isPresent, onToggle }: Props) {
  const [isPending, startTransition] = useTransition();

  function click() {
    startTransition(async () => {
      await onToggle();
    });
  }

  return (
    <div className="card-grimoire flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            isPresent ? "presence-led-on" : "presence-led-off"
          }`}
          aria-hidden
        />
        {isPresent ? (
          <div>
            <p className="font-display text-[0.78rem] uppercase tracking-[0.18em] text-celadon">
              Présent à la table
            </p>
            <p className="mt-0.5 text-[0.7rem] text-parchment-mute">
              Visible par les autres joueurs sur le plateau.
            </p>
          </div>
        ) : (
          <div>
            <p className="font-display text-[0.78rem] uppercase tracking-[0.18em] text-parchment-dim">
              Absent
            </p>
            <p className="mt-0.5 text-[0.7rem] text-parchment-mute">
              Le MJ ne te voit pas sur le plateau.
            </p>
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={click}
        className={isPresent ? "btn-ghost" : "btn-grimoire"}
      >
        {isPresent ? "Quitter la session" : "Rejoindre la table"}
      </button>
    </div>
  );
}
