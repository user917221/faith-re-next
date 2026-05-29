"use client";

import { useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Statut de présence à la table. Toggle isPresent du perso.
 *
 * - ON  : LED endurance pulse + label "Présent à la table" + bouton outline "Quitter"
 * - OFF : LED ink-tertiary statique + label "Absent" + bouton primaire lavande "Rejoindre"
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
    <Card size="sm">
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              isPresent ? "presence-led-on" : "presence-led-off"
            }`}
            aria-hidden
          />
          {isPresent ? (
            <div>
              <p className="text-sm font-medium text-endu">
                Présent à la table
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Visible par les autres joueurs sur le plateau.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-ink-muted">Absent</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Le MJ ne te voit pas sur le plateau.
              </p>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant={isPresent ? "outline" : "default"}
          size="sm"
          disabled={isPending}
          onClick={click}
        >
          {isPresent ? "Quitter la session" : "Rejoindre la table"}
        </Button>
      </CardContent>
    </Card>
  );
}
