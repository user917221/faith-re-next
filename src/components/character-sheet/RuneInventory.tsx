"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { RUNE_TYPES, RUNE_TYPE_LABEL, type RuneType } from "@/lib/faith-system";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RuneItem } from "./types";

/**
 * Inventaire de runes — Card Linear dense.
 *
 * Runes regroupées par type (Utilitaire / Armement / Prédéfinie), chaque groupe
 * coiffé d'un eyebrow `.label-grimoire`. Chaque rune = ligne dense (nom +
 * description optionnelle + bouton supprimer). Empty shadcn quand vide.
 *
 * Le mini-formulaire d'ajout (Input nom + Select type + Input description) n'est
 * rendu que si `onAddRune` est fourni — côté joueur read-only, on ne montre que
 * la liste.
 */

type Props = {
  runes: RuneItem[];
  onAddRune?: (input: {
    name: string;
    type: RuneType;
    description?: string;
  }) => Promise<void>;
  onRemoveRune?: (runeId: string) => Promise<void>;
};

/** Ligne dense d'une rune — nom + description + suppression. */
function RuneRow({
  rune,
  onRemoveRune,
}: {
  rune: RuneItem;
  onRemoveRune?: (runeId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{rune.name}</p>
        {rune.description ? (
          <p className="text-xs text-muted-foreground">{rune.description}</p>
        ) : null}
      </div>
      {onRemoveRune ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Supprimer ${rune.name}`}
          title="Supprimer"
          disabled={isPending}
          onClick={() => startTransition(() => onRemoveRune(rune.id))}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

/** Mini-formulaire d'ajout — nom + type + description optionnelle. */
function AddRuneForm({
  onAddRune,
}: {
  onAddRune: (input: {
    name: string;
    type: RuneType;
    description?: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<RuneType>("utilitaire");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !isPending;

  function submit() {
    if (!canSubmit) return;
    const desc = description.trim();
    startTransition(async () => {
      await onAddRune({
        name: trimmedName,
        type,
        description: desc.length > 0 ? desc : undefined,
      });
      setName("");
      setDescription("");
      setType("utilitaire");
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Nom de la rune"
          placeholder="Nom de la rune"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          disabled={isPending}
          className="h-8 min-w-0 flex-1"
        />
        <Select
          value={type}
          onValueChange={(v) => setType(v as RuneType)}
          disabled={isPending}
        >
          <SelectTrigger size="sm" aria-label="Type de rune" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RUNE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {RUNE_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
          aria-label="Ajouter la rune"
        >
          <Plus className="size-3.5" />
          Ajouter
        </Button>
      </div>
    </div>
  );
}

export function RuneInventory({ runes, onAddRune, onRemoveRune }: Props) {
  // Groupage par type, dans l'ordre canonique de RUNE_TYPES.
  const groups = RUNE_TYPES.map((type) => ({
    type,
    label: RUNE_TYPE_LABEL[type],
    items: runes.filter((r) => r.type === type),
  })).filter((g) => g.items.length > 0);

  const hasRunes = runes.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventaire de runes</CardTitle>
      </CardHeader>
      <CardContent>
        {hasRunes ? (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.type}>
                <p className="label-grimoire mb-1">{group.label}</p>
                <div className="divide-y divide-border">
                  {group.items.map((rune) => (
                    <RuneRow
                      key={rune.id}
                      rune={rune}
                      onRemoveRune={onRemoveRune}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty className="border-0 p-0 py-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Plus className="size-4" />
              </EmptyMedia>
              <EmptyTitle>Aucune rune</EmptyTitle>
              <EmptyDescription>
                {onAddRune
                  ? "Ajoute une première rune à l'inventaire."
                  : "L'inventaire de runes est vide."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {onAddRune ? <AddRuneForm onAddRune={onAddRune} /> : null}
      </CardContent>
    </Card>
  );
}
