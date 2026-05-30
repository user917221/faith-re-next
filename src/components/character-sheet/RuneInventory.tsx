"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { RUNE_TYPES, RUNE_TYPE_LABEL, type RuneType } from "@/lib/faith-system";
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
import type { RuneItem, RuneRarity } from "./types";

/**
 * Inventaire de runes (onglet « Runes »). Runes groupées par catégorie
 * (Armement / Utilitaire / Prédéfinie), chaque rune avec niveau (±), rareté
 * (cycle) et dégâts (éditable). Add/remove. Lecture seule sans handlers.
 */

const RARITY_ORDER: RuneRarity[] = [
  "commune",
  "rare",
  "epique",
  "legendaire",
];
const RARITY_META: Record<RuneRarity, { label: string; rgb: string }> = {
  commune: { label: "Commune", rgb: "150,150,168" },
  rare: { label: "Rare", rgb: "111,166,184" },
  epique: { label: "Épique", rgb: "162,128,214" },
  legendaire: { label: "Légendaire", rgb: "196,154,92" },
};

type UpdateFn = (
  runeId: string,
  patch: {
    level?: number;
    rarity?: RuneRarity;
    damage?: string;
    armor?: number;
    qty?: number;
  },
) => Promise<void>;

type Props = {
  runes: RuneItem[];
  onAddRune?: (input: {
    name: string;
    type: RuneType;
    description?: string;
  }) => Promise<void>;
  onRemoveRune?: (runeId: string) => Promise<void>;
  onUpdateRune?: UpdateFn;
};

/** Champ de dégâts éditable inline (commit sur blur / Entrée). */
function DamageField({
  value,
  onCommit,
}: {
  value: string | null;
  onCommit: (v: string) => void;
}) {
  const [v, setV] = useState(value ?? "");
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== (value ?? "") && onCommit(v)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      maxLength={24}
      placeholder="—"
      aria-label="Dégâts"
      className="h-6 w-20 rounded border border-border bg-background px-1.5 text-center font-mono text-xs tabular-nums text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none"
    />
  );
}

/** Champ d'armure éditable inline (commit sur blur / Entrée), 0-99. */
function ArmorField({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (v: number) => void;
}) {
  const [v, setV] = useState(String(value ?? 0));
  return (
    <input
      type="number"
      min={0}
      max={99}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const n = Math.max(0, Math.min(99, parseInt(v || "0", 10) || 0));
        if (n !== value) onCommit(n);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      placeholder="0"
      aria-label="Armure"
      className="h-6 w-12 rounded border border-border bg-background px-1.5 text-center font-mono text-xs tabular-nums text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}

function RuneRow({
  rune,
  onRemoveRune,
  onUpdateRune,
}: {
  rune: RuneItem;
  onRemoveRune?: (runeId: string) => Promise<void>;
  onUpdateRune?: UpdateFn;
}) {
  const [isPending, startTransition] = useTransition();
  const run = (fn: () => Promise<void>) => startTransition(() => fn());
  const meta = RARITY_META[rune.rarity];

  const cycleRarity = () => {
    if (!onUpdateRune) return;
    const next =
      RARITY_ORDER[(RARITY_ORDER.indexOf(rune.rarity) + 1) % RARITY_ORDER.length];
    run(() => onUpdateRune(rune.id, { rarity: next }));
  };

  return (
    <div className="rounded-md border border-border bg-background/25 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
            <span className="truncate">{rune.name}</span>
            <button
              type="button"
              onClick={cycleRarity}
              disabled={!onUpdateRune || isPending}
              title={onUpdateRune ? "Changer la rareté" : undefined}
              className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide"
              style={{
                background: `rgba(${meta.rgb},0.14)`,
                border: `1px solid rgba(${meta.rgb},0.34)`,
                color: `rgb(${meta.rgb})`,
                cursor: onUpdateRune ? "pointer" : "default",
              }}
            >
              {meta.label}
            </button>
          </p>
          {rune.description ? (
            <p className="mt-0.5 text-xs text-foreground-muted">
              {rune.description}
            </p>
          ) : null}
        </div>
        {onRemoveRune && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Supprimer ${rune.name}`}
            title="Supprimer"
            disabled={isPending}
            onClick={() => run(() => onRemoveRune(rune.id))}
            className="shrink-0 text-foreground-muted hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
        {/* Niveau */}
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
            Niveau
          </span>
          {onUpdateRune && (
            <button
              type="button"
              aria-label="Niveau −1"
              disabled={isPending || rune.level <= 1}
              onClick={() => run(() => onUpdateRune(rune.id, { level: rune.level - 1 }))}
              className="flex size-5 items-center justify-center rounded border border-border text-foreground-subtle transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Minus size={10} />
            </button>
          )}
          <span className="w-5 text-center font-mono text-sm font-semibold tabular-nums slashed-zero text-foreground">
            {rune.level}
          </span>
          {onUpdateRune && (
            <button
              type="button"
              aria-label="Niveau +1"
              disabled={isPending}
              onClick={() => run(() => onUpdateRune(rune.id, { level: rune.level + 1 }))}
              className="flex size-5 items-center justify-center rounded border border-border text-foreground-subtle transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Plus size={10} />
            </button>
          )}
        </span>

        {/* Dégâts */}
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
            Dégâts
          </span>
          {onUpdateRune ? (
            <DamageField
              value={rune.damage}
              onCommit={(d) => run(() => onUpdateRune(rune.id, { damage: d }))}
            />
          ) : (
            <span className="font-mono text-xs tabular-nums text-foreground">
              {rune.damage ?? "—"}
            </span>
          )}
        </span>

        {/* Armure */}
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
            Armure
          </span>
          {onUpdateRune ? (
            <ArmorField
              value={rune.armor}
              onCommit={(a) => run(() => onUpdateRune(rune.id, { armor: a }))}
            />
          ) : (
            <span className="font-mono text-xs tabular-nums text-foreground">
              {rune.armor}
            </span>
          )}
        </span>

        {/* Quantité */}
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
            Qté
          </span>
          {onUpdateRune && (
            <button
              type="button"
              aria-label="Quantité −1"
              disabled={isPending || rune.qty <= 1}
              onClick={() => run(() => onUpdateRune(rune.id, { qty: rune.qty - 1 }))}
              className="flex size-5 items-center justify-center rounded border border-border text-foreground-subtle transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Minus size={10} />
            </button>
          )}
          <span className="w-5 text-center font-mono text-sm font-semibold tabular-nums slashed-zero text-foreground">
            {rune.qty}
          </span>
          {onUpdateRune && (
            <button
              type="button"
              aria-label="Quantité +1"
              disabled={isPending}
              onClick={() => run(() => onUpdateRune(rune.id, { qty: rune.qty + 1 }))}
              className="flex size-5 items-center justify-center rounded border border-border text-foreground-subtle transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Plus size={10} />
            </button>
          )}
        </span>
      </div>
    </div>
  );
}

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
  const [type, setType] = useState<RuneType>("armement");
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
      setType("armement");
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
          onValueChange={(val) => setType(val as RuneType)}
          disabled={isPending}
        >
          <SelectTrigger size="sm" aria-label="Catégorie de rune" className="w-36">
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

export function RuneInventory({
  runes,
  onAddRune,
  onRemoveRune,
  onUpdateRune,
}: Props) {
  const groups = RUNE_TYPES.map((type) => ({
    type,
    label: RUNE_TYPE_LABEL[type],
    items: runes.filter((r) => r.type === type),
  })).filter((g) => g.items.length > 0);

  const hasRunes = runes.length > 0;

  return (
    <section className="campaign-panel">
      <div className="campaign-header-line flex items-center justify-between px-5 py-3.5">
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
          Inventaire de runes
        </h2>
        {hasRunes && (
          <span className="font-mono text-[10px] tabular-nums text-foreground-subtle">
            {runes.length}
          </span>
        )}
      </div>
      <div className="p-5">
        {hasRunes ? (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.type}>
                <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
                  {group.label}
                </p>
                <div className="flex flex-col gap-2">
                  {group.items.map((rune) => (
                    <RuneRow
                      key={rune.id}
                      rune={rune}
                      onRemoveRune={onRemoveRune}
                      onUpdateRune={onUpdateRune}
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
      </div>
    </section>
  );
}
