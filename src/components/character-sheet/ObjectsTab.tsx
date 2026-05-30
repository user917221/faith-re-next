"use client";

/**
 * ObjectsTab — onglet « Objets » de la fiche. Trois sections :
 *  1. Cristaux de Lumière — compteur (0-999), chaque cristal = 1 XP.
 *  2. Runes — inventaire existant (réutilise <RuneInventory>).
 *  3. Compétences de l'Aléa — récompenses spéciales liées au hasard du jeu.
 *
 * Lecture seule sans handlers (mêmes conventions que les autres panneaux).
 */

import { useEffect, useState, useTransition } from "react";
import { Gem, Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { RuneType } from "@/lib/faith-system";
import { RuneInventory } from "./RuneInventory";
import type { Character, CompetenceAleaItem, RuneRarity } from "./types";

type RunePatch = {
  level?: number;
  rarity?: RuneRarity;
  damage?: string;
  armor?: number;
  qty?: number;
};

type Props = {
  character: Character;
  onAddRune?: (input: {
    name: string;
    type: RuneType;
    description?: string;
  }) => Promise<void>;
  onRemoveRune?: (runeId: string) => Promise<void>;
  onUpdateRune?: (runeId: string, patch: RunePatch) => Promise<void>;
  onUpdateLightCrystals?: (newCount: number) => Promise<void>;
  onAddCompetenceAlea?: (input: {
    name: string;
    description?: string;
  }) => Promise<void>;
  onRemoveCompetenceAlea?: (competenceId: string) => Promise<void>;
};

/* -------------------------- Cristaux de Lumière -------------------------- */

function LightCrystalsSection({
  value,
  onUpdate,
}: {
  value: number;
  onUpdate?: (newCount: number) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState(String(value));

  // Resynchronise le champ si la valeur serveur change (révalidation).
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (n: number) => {
    const clamped = Math.max(0, Math.min(999, n));
    setDraft(String(clamped));
    if (!onUpdate || clamped === value) return;
    startTransition(() => onUpdate(clamped));
  };

  const commitDraft = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n)) commit(n);
    else setDraft(String(value)); // saisie invalide → on revient à la valeur courante
  };

  return (
    <section className="campaign-panel">
      <div className="campaign-header-line flex items-center justify-between px-5 py-3.5">
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
          Cristaux de Lumière
        </h2>
        <span className="font-mono text-[10px] tabular-nums text-foreground-subtle">
          1 cristal = 1 XP
        </span>
      </div>
      <div className="flex items-center gap-3 p-5">
        <Gem className="size-5 text-primary" aria-hidden />
        {onUpdate ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Cristaux −1"
              disabled={isPending || value <= 0}
              onClick={() => commit(value - 1)}
              className="flex size-7 items-center justify-center rounded-md border border-border text-foreground-subtle transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Minus size={13} />
            </button>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={999}
              aria-label="Nombre de cristaux de lumière"
              value={draft}
              disabled={isPending}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              className="h-10 w-20 text-center font-mono text-lg font-semibold tabular-nums slashed-zero"
            />
            <button
              type="button"
              aria-label="Cristaux +1"
              disabled={isPending || value >= 999}
              onClick={() => commit(value + 1)}
              className="flex size-7 items-center justify-center rounded-md border border-border text-foreground-subtle transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Plus size={13} />
            </button>
          </div>
        ) : (
          <span className="font-mono text-2xl font-semibold tabular-nums slashed-zero text-foreground">
            {value}
          </span>
        )}
      </div>
    </section>
  );
}

/* -------------------------- Compétences de l'Aléa -------------------------- */

function CompetencesAleaSection({
  competences,
  onAdd,
  onRemove,
}: {
  competences: CompetenceAleaItem[];
  onAdd?: (input: { name: string; description?: string }) => Promise<void>;
  onRemove?: (competenceId: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !isPending && Boolean(onAdd);

  const submit = () => {
    if (!canSubmit || !onAdd) return;
    const desc = description.trim();
    startTransition(async () => {
      await onAdd({ name: trimmedName, description: desc.length ? desc : undefined });
      setName("");
      setDescription("");
    });
  };

  const hasItems = competences.length > 0;

  return (
    <section className="campaign-panel">
      <div className="campaign-header-line flex items-center justify-between px-5 py-3.5">
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
          Compétences de l&apos;Aléa
        </h2>
        {hasItems && (
          <span className="font-mono text-[10px] tabular-nums text-foreground-subtle">
            {competences.length}
          </span>
        )}
      </div>
      <div className="p-5">
        {hasItems ? (
          <div className="flex flex-col gap-2">
            {competences.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border bg-background/25 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  {c.description ? (
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      {c.description}
                    </p>
                  ) : null}
                </div>
                {onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Supprimer ${c.name}`}
                    title="Supprimer"
                    disabled={isPending}
                    onClick={() => startTransition(() => onRemove(c.id))}
                    className="shrink-0 text-foreground-muted hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty className="border-0 p-0 py-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Sparkles className="size-4" />
              </EmptyMedia>
              <EmptyTitle>Aucune compétence de l&apos;Aléa</EmptyTitle>
              <EmptyDescription>
                {onAdd
                  ? "Ajoute une récompense spéciale obtenue par le hasard du jeu."
                  : "Aucune récompense de l'Aléa pour l'instant."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {onAdd ? (
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            <Input
              aria-label="Nom de la compétence"
              placeholder="Nom de la compétence"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              disabled={isPending}
              className="h-8"
            />
            <div className="flex items-center gap-2">
              <Input
                aria-label="Description (optionnelle)"
                placeholder="Description (optionnelle)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                disabled={isPending}
                className="h-8 min-w-0 flex-1 text-xs"
              />
              <Button
                type="button"
                size="sm"
                onClick={submit}
                disabled={!canSubmit}
                aria-label="Ajouter la compétence"
              >
                <Plus className="size-3.5" />
                Ajouter
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------- ObjectsTab -------------------------- */

export function ObjectsTab({
  character,
  onAddRune,
  onRemoveRune,
  onUpdateRune,
  onUpdateLightCrystals,
  onAddCompetenceAlea,
  onRemoveCompetenceAlea,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <LightCrystalsSection
        value={character.lightCrystals}
        onUpdate={onUpdateLightCrystals}
      />
      <RuneInventory
        runes={character.runesInventory}
        onAddRune={onAddRune}
        onRemoveRune={onRemoveRune}
        onUpdateRune={onUpdateRune}
      />
      <CompetencesAleaSection
        competences={character.competencesAlea}
        onAdd={onAddCompetenceAlea}
        onRemove={onRemoveCompetenceAlea}
      />
    </div>
  );
}
