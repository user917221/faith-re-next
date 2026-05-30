"use client";

/**
 * StatusNotesPanel — notes de statut d'un perso (cockpit MJ, Phase 5).
 * Liste (auteur + horodatage relatif), ajout inline, retrait ×.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { addStatusNote, removeStatusNote } from "@/lib/actions";

export type StatusNote = {
  id: string;
  text: string;
  authorName: string;
  createdAt: Date | string;
};

function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.max(0, Date.now() - d.getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  return `il y a ${j} j`;
}

export function StatusNotesPanel({
  characterId,
  notes,
}: {
  characterId: string;
  notes: StatusNote[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const clean = text.trim();
    if (!clean) return;
    startTransition(async () => {
      const res = await addStatusNote(characterId, clean);
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      setText("");
      router.refresh();
    });
  };

  const remove = (id: string) =>
    startTransition(async () => {
      await removeStatusNote(id);
      router.refresh();
    });

  return (
    <section className="campaign-panel">
      <header className="campaign-header-line flex items-center justify-between px-4 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
          Notes de statut
        </p>
        <span className="font-mono text-[10px] tabular-nums text-foreground-subtle">
          {notes.length}
        </span>
      </header>

      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start gap-1.5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={2}
            maxLength={280}
            placeholder="Note (⌘+Entrée pour ajouter)…"
            className="min-w-0 flex-1 resize-none rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={isPending || !text.trim()}
            aria-label="Ajouter la note"
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Plus size={15} />
          </button>
        </div>

        {notes.length === 0 ? (
          <p className="px-1 py-1 text-xs text-foreground-subtle">
            Aucune note pour l&apos;instant.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {notes.map((n) => (
              <li
                key={n.id}
                className="group rounded-md border border-border bg-background/30 px-2.5 py-2"
              >
                <p className="text-sm text-foreground">{n.text}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-foreground-subtle">
                    {n.authorName} · {relativeTime(n.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(n.id)}
                    disabled={isPending}
                    aria-label="Supprimer la note"
                    className="text-foreground-subtle opacity-0 transition-opacity hover:text-hp group-hover:opacity-100 disabled:opacity-30"
                  >
                    <X size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
