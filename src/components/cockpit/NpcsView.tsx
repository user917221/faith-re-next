"use client";

/**
 * NpcsView — PNJ de campagne (Phase 7, développé). Recherche + filtre par
 * disposition, cartes éditables en place (nom/rôle/disposition/description),
 * ajout / suppression. Réservé MJ pour l'édition.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCircle2, Plus, Trash2, Pencil, Search, Check } from "lucide-react";
import { toast } from "sonner";
import { addNpc, removeNpc, updateNpc } from "@/lib/actions";

type Disposition = "allie" | "neutre" | "hostile";

export type NpcView = {
  id: string;
  name: string;
  role: string | null;
  disposition: Disposition;
  description: string | null;
};

const DISPO_META: Record<Disposition, { label: string; rgb: string }> = {
  allie: { label: "Allié", rgb: "130,169,107" },
  neutre: { label: "Neutre", rgb: "150,150,168" },
  hostile: { label: "Hostile", rgb: "200,95,80" },
};
const DISPO_ORDER: Disposition[] = ["allie", "neutre", "hostile"];

const inputCls =
  "h-9 min-w-0 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none";

function DispoPills({
  value,
  onChange,
}: {
  value: Disposition;
  onChange: (d: Disposition) => void;
}) {
  return (
    <div className="flex gap-1">
      {DISPO_ORDER.map((d) => {
        const m = DISPO_META[d];
        const active = value === d;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className="rounded-md px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-colors"
            style={{
              background: active ? `rgba(${m.rgb},0.16)` : "transparent",
              border: `1px solid rgba(${m.rgb},${active ? 0.4 : 0.18})`,
              color: active ? `rgb(${m.rgb})` : "var(--foreground-subtle)",
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

function NpcCard({
  npc,
  canEdit,
}: {
  npc: NpcView;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(npc.name);
  const [role, setRole] = useState(npc.role ?? "");
  const [disposition, setDisposition] = useState<Disposition>(npc.disposition);
  const [description, setDescription] = useState(npc.description ?? "");
  const [isPending, startTransition] = useTransition();
  const m = DISPO_META[npc.disposition];

  const save = () => {
    const n = name.trim();
    if (!n) return;
    startTransition(async () => {
      const res = await updateNpc(npc.id, { name: n, role, disposition, description });
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  };
  const cycle = () =>
    startTransition(async () => {
      const next = DISPO_ORDER[(DISPO_ORDER.indexOf(npc.disposition) + 1) % 3];
      await updateNpc(npc.id, { disposition: next });
      router.refresh();
    });
  const remove = () =>
    startTransition(async () => {
      await removeNpc(npc.id);
      router.refresh();
    });

  if (editing) {
    return (
      <article className="campaign-panel flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Nom" className={`${inputCls} flex-1`} />
          <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} placeholder="Rôle" className={`${inputCls} flex-1`} />
        </div>
        <DispoPills value={disposition} onChange={setDisposition} />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Description"
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none"
        />
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} className="rounded-md px-2.5 py-1 text-xs text-foreground-subtle hover:text-foreground">
            Annuler
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isPending || !name.trim()}
            className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Check size={13} /> Enregistrer
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="campaign-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{npc.name}</h2>
          {npc.role && <p className="truncate text-xs text-foreground-muted">{npc.role}</p>}
        </div>
        <button
          type="button"
          onClick={() => canEdit && cycle()}
          disabled={!canEdit || isPending}
          title={canEdit ? "Changer la disposition" : undefined}
          className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide"
          style={{
            background: `rgba(${m.rgb},0.12)`,
            border: `1px solid rgba(${m.rgb},0.3)`,
            color: `rgb(${m.rgb})`,
            cursor: canEdit ? "pointer" : "default",
          }}
        >
          {m.label}
        </button>
      </div>
      {npc.description && <p className="mt-2 text-xs text-foreground-muted">{npc.description}</p>}
      {canEdit && (
        <div className="mt-2.5 flex items-center justify-end gap-3 border-t border-border pt-2.5">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[11px] text-foreground-subtle transition-colors hover:text-foreground"
          >
            <Pencil size={12} /> Modifier
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="flex items-center gap-1 text-[11px] text-foreground-subtle transition-colors hover:text-hp disabled:opacity-30"
          >
            <Trash2 size={12} /> Supprimer
          </button>
        </div>
      )}
    </article>
  );
}

export function NpcsView({
  campaignId,
  npcs,
  canEdit = false,
}: {
  campaignId: string;
  npcs: NpcView[];
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Disposition | "all">("all");
  // Champs d'ajout
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [disposition, setDisposition] = useState<Disposition>("neutre");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c = { allie: 0, neutre: 0, hostile: 0 };
    for (const n of npcs) c[n.disposition]++;
    return c;
  }, [npcs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return npcs.filter((n) => {
      if (filter !== "all" && n.disposition !== filter) return false;
      if (!q) return true;
      return (
        n.name.toLowerCase().includes(q) ||
        (n.role ?? "").toLowerCase().includes(q) ||
        (n.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [npcs, query, filter]);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    startTransition(async () => {
      const res = await addNpc(campaignId, { name: n, role, disposition, description });
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      setName("");
      setRole("");
      setDescription("");
      setDisposition("neutre");
      toast.success("PNJ ajouté");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <header className="flex flex-wrap items-center gap-3">
        <UserCircle2 size={18} className="text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Personnages non-joueurs</h1>
        <span className="font-mono text-[11px] tabular-nums text-foreground-subtle">
          {npcs.length}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className={`${inputCls} h-8 w-44 pl-7`}
            />
          </div>
        </div>
      </header>

      {/* Filtre par disposition */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip label="Tous" count={npcs.length} active={filter === "all"} onClick={() => setFilter("all")} />
        {DISPO_ORDER.map((d) => (
          <FilterChip
            key={d}
            label={DISPO_META[d].label}
            count={counts[d]}
            rgb={DISPO_META[d].rgb}
            active={filter === d}
            onClick={() => setFilter(filter === d ? "all" : d)}
          />
        ))}
      </div>

      {canEdit && (
        <section className="campaign-panel flex flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Nom du PNJ" className={`${inputCls} flex-1`} />
            <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} placeholder="Rôle (marchand, garde…)" className={`${inputCls} flex-1`} />
            <DispoPills value={disposition} onChange={setDisposition} />
          </div>
          <div className="flex items-center gap-2">
            <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} placeholder="Description (optionnelle)" className={`${inputCls} flex-1`} />
            <button
              type="button"
              onClick={add}
              disabled={isPending || !name.trim()}
              className="flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </section>
      )}

      {visible.length === 0 ? (
        <p className="campaign-panel p-8 text-center text-sm text-foreground-subtle">
          {npcs.length === 0
            ? canEdit
              ? "Aucun PNJ. Ajoute le premier personnage non-joueur."
              : "Aucun PNJ."
            : "Aucun PNJ ne correspond à la recherche."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visible.map((npc) => (
            <NpcCard key={npc.id} npc={npc} canEdit={canEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  rgb,
  active,
  onClick,
}: {
  label: string;
  count: number;
  rgb?: string;
  active: boolean;
  onClick: () => void;
}) {
  const color = rgb ? `rgb(${rgb})` : "var(--foreground-muted)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors"
      style={{
        background: active ? (rgb ? `rgba(${rgb},0.14)` : "var(--surface-overlay)") : "transparent",
        border: `1px solid ${active ? (rgb ? `rgba(${rgb},0.34)` : "var(--border)") : "var(--border)"}`,
        color: active ? color : "var(--foreground-muted)",
      }}
    >
      {label}
      <span className="font-mono text-[10px] tabular-nums opacity-70">{count}</span>
    </button>
  );
}
