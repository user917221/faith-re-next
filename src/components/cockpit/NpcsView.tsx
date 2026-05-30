"use client";

/**
 * NpcsView — PNJ de campagne (Phase 7). Cartes légères (nom, rôle,
 * disposition, description). Ajout/suppression MJ, disposition cyclable.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCircle2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addNpc, removeNpc, updateNpcDisposition } from "@/lib/actions";

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
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [disposition, setDisposition] = useState<Disposition>("neutre");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
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

  const cycle = (npc: NpcView) => {
    const next = DISPO_ORDER[(DISPO_ORDER.indexOf(npc.disposition) + 1) % 3];
    startTransition(async () => {
      await updateNpcDisposition(npc.id, next);
      router.refresh();
    });
  };

  const remove = (id: string) =>
    startTransition(async () => {
      await removeNpc(id);
      router.refresh();
    });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <header className="flex items-center gap-2.5">
        <UserCircle2 size={18} className="text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Personnages non-joueurs</h1>
        <span className="font-mono text-[11px] tabular-nums text-foreground-subtle">
          {npcs.length}
        </span>
      </header>

      {canEdit && (
        <section className="campaign-panel flex flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Nom du PNJ"
              className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none"
            />
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              maxLength={80}
              placeholder="Rôle (marchand, garde…)"
              className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none"
            />
            <div className="flex gap-1">
              {DISPO_ORDER.map((d) => {
                const m = DISPO_META[d];
                const active = disposition === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDisposition(d)}
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
          </div>
          <div className="flex items-center gap-2">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              placeholder="Description (optionnelle)"
              className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={submit}
              disabled={isPending || !name.trim()}
              className="flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </section>
      )}

      {npcs.length === 0 ? (
        <p className="campaign-panel p-8 text-center text-sm text-foreground-subtle">
          Aucun PNJ. {canEdit ? "Ajoute le premier personnage non-joueur." : ""}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {npcs.map((npc) => {
            const m = DISPO_META[npc.disposition];
            return (
              <article key={npc.id} className="campaign-panel p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-foreground">
                      {npc.name}
                    </h2>
                    {npc.role && (
                      <p className="truncate text-xs text-foreground-muted">{npc.role}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => canEdit && cycle(npc)}
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
                {npc.description && (
                  <p className="mt-2 text-xs text-foreground-muted">{npc.description}</p>
                )}
                {canEdit && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => remove(npc.id)}
                      disabled={isPending}
                      aria-label="Supprimer le PNJ"
                      className="text-foreground-subtle transition-colors hover:text-hp disabled:opacity-30"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
