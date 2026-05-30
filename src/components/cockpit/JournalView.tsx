"use client";

/**
 * JournalView — journal de campagne (Phase 7). Entrées chronologiques
 * (résumés de séance, événements). Ajout/suppression MJ.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addJournalEntry, removeJournalEntry } from "@/lib/actions";

export type JournalEntryView = {
  id: string;
  title: string;
  body: string;
  sessionNumber: number;
  createdAt: Date | string;
};

function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function JournalView({
  campaignId,
  entries,
  currentSession = 1,
  canEdit = false,
}: {
  campaignId: string;
  entries: JournalEntryView[];
  currentSession?: number;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    startTransition(async () => {
      const res = await addJournalEntry(campaignId, {
        title: t,
        body,
        sessionNumber: currentSession,
      });
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      setTitle("");
      setBody("");
      toast.success("Entrée ajoutée");
      router.refresh();
    });
  };

  const remove = (id: string) =>
    startTransition(async () => {
      await removeJournalEntry(id);
      router.refresh();
    });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex items-center gap-2.5">
        <BookText size={18} className="text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Journal de campagne</h1>
        <span className="font-mono text-[11px] tabular-nums text-foreground-subtle">
          {entries.length} entrée{entries.length > 1 ? "s" : ""}
        </span>
      </header>

      {canEdit && (
        <section className="campaign-panel p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder={`Titre de l'entrée (Session ${currentSession})…`}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="Résumé, événements marquants, révélations…"
            className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={isPending || !title.trim()}
              className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Plus size={14} /> Ajouter au journal
            </button>
          </div>
        </section>
      )}

      {entries.length === 0 ? (
        <p className="campaign-panel p-8 text-center text-sm text-foreground-subtle">
          Le journal est vide. {canEdit ? "Ajoute une première entrée." : ""}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <article key={e.id} className="campaign-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">{e.title}</h2>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
                    Session {e.sessionNumber} · {fmtDate(e.createdAt)}
                  </p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => remove(e.id)}
                    disabled={isPending}
                    aria-label="Supprimer l'entrée"
                    className="shrink-0 text-foreground-subtle transition-colors hover:text-hp disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {e.body && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground-muted">
                  {e.body}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
