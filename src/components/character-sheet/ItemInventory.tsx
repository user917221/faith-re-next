"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Shield, ShieldCheck, Trash2 } from "lucide-react";
import { ITEM_TYPES, ITEM_TYPE_LABEL, type ItemType } from "@/lib/items";
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
import type { ItemEntry } from "./types";

/**
 * Inventaire d'objets (Phase 6) — distinct des runes. Groupé par type
 * (Armes / Armures / Objets / Consommables), quantité ±, bascule équipé,
 * suppression. Formulaire d'ajout rendu seulement si `onAddItem` fourni.
 */
type Props = {
  items: ItemEntry[];
  onAddItem?: (input: {
    name: string;
    type: ItemType;
    qty?: number;
    description?: string;
  }) => Promise<void>;
  onRemoveItem?: (itemId: string) => Promise<void>;
  onToggleEquip?: (itemId: string) => Promise<void>;
  onUpdateItemQty?: (itemId: string, delta: number) => Promise<void>;
};

function ItemRow({
  item,
  onRemoveItem,
  onToggleEquip,
  onUpdateItemQty,
}: {
  item: ItemEntry;
  onRemoveItem?: (itemId: string) => Promise<void>;
  onToggleEquip?: (itemId: string) => Promise<void>;
  onUpdateItemQty?: (itemId: string, delta: number) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const run = (fn: () => Promise<void>) => startTransition(() => fn());
  const equippable = item.type === "arme" || item.type === "armure";

  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="truncate">{item.name}</span>
          {item.equipped && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-endu" style={{ background: "rgba(130,169,107,0.12)" }}>
              <ShieldCheck size={9} /> Équipé
            </span>
          )}
        </p>
        {item.description ? (
          <p className="text-xs text-foreground-muted">{item.description}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {onUpdateItemQty && (
          <span className="flex items-center gap-1">
            <button
              type="button"
              aria-label="−1"
              disabled={isPending}
              onClick={() => run(() => onUpdateItemQty(item.id, -1))}
              className="flex size-5 items-center justify-center rounded border border-border text-foreground-subtle transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Minus size={10} />
            </button>
            <span className="w-5 text-center font-mono text-xs tabular-nums slashed-zero text-foreground">
              {item.qty}
            </span>
            <button
              type="button"
              aria-label="+1"
              disabled={isPending}
              onClick={() => run(() => onUpdateItemQty(item.id, 1))}
              className="flex size-5 items-center justify-center rounded border border-border text-foreground-subtle transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Plus size={10} />
            </button>
          </span>
        )}
        {onToggleEquip && equippable && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={item.equipped ? "Déséquiper" : "Équiper"}
            title={item.equipped ? "Déséquiper" : "Équiper"}
            disabled={isPending}
            onClick={() => run(() => onToggleEquip(item.id))}
            className={item.equipped ? "text-endu" : "text-foreground-muted hover:text-foreground"}
          >
            {item.equipped ? <ShieldCheck className="size-3.5" /> : <Shield className="size-3.5" />}
          </Button>
        )}
        {onRemoveItem && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Supprimer ${item.name}`}
            title="Supprimer"
            disabled={isPending}
            onClick={() => run(() => onRemoveItem(item.id))}
            className="text-foreground-muted hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function AddItemForm({
  onAddItem,
}: {
  onAddItem: (input: {
    name: string;
    type: ItemType;
    qty?: number;
    description?: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ItemType>("objet");
  const [qty, setQty] = useState(1);
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !isPending;

  function submit() {
    if (!canSubmit) return;
    const desc = description.trim();
    startTransition(async () => {
      await onAddItem({
        name: trimmed,
        type,
        qty: Math.max(1, qty),
        description: desc.length > 0 ? desc : undefined,
      });
      setName("");
      setDescription("");
      setQty(1);
      setType("objet");
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Nom de l'objet"
          placeholder="Nom de l'objet"
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
        <Select value={type} onValueChange={(v) => setType(v as ItemType)} disabled={isPending}>
          <SelectTrigger size="sm" aria-label="Type d'objet" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ITEM_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {ITEM_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          min={1}
          aria-label="Quantité"
          value={qty}
          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
          disabled={isPending}
          className="h-8 w-16 text-center font-mono tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
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
        <Button type="button" size="sm" onClick={submit} disabled={!canSubmit} aria-label="Ajouter l'objet">
          <Plus className="size-3.5" />
          Ajouter
        </Button>
      </div>
    </div>
  );
}

export function ItemInventory({
  items,
  onAddItem,
  onRemoveItem,
  onToggleEquip,
  onUpdateItemQty,
}: Props) {
  const groups = ITEM_TYPES.map((type) => ({
    type,
    label: ITEM_TYPE_LABEL[type],
    list: items.filter((i) => i.type === type),
  })).filter((g) => g.list.length > 0);

  const hasItems = items.length > 0;

  return (
    <section className="campaign-panel">
      <div className="campaign-header-line flex items-center justify-between px-5 py-3.5">
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
          Inventaire d&apos;objets
        </h2>
        {hasItems && (
          <span className="font-mono text-[10px] tabular-nums text-foreground-subtle">
            {items.length}
          </span>
        )}
      </div>
      <div className="p-5">
        {hasItems ? (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.type}>
                <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
                  {group.label}
                </p>
                <div className="divide-y divide-border">
                  {group.list.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onRemoveItem={onRemoveItem}
                      onToggleEquip={onToggleEquip}
                      onUpdateItemQty={onUpdateItemQty}
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
              <EmptyTitle>Aucun objet</EmptyTitle>
              <EmptyDescription>
                {onAddItem
                  ? "Ajoute un premier objet à l'inventaire."
                  : "L'inventaire est vide."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {onAddItem ? <AddItemForm onAddItem={onAddItem} /> : null}
      </div>
    </section>
  );
}
