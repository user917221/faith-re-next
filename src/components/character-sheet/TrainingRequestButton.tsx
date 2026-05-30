"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PendingTrainingRequest } from "./types";

type Props = {
  pending?: PendingTrainingRequest | null;
  onRequestTraining?: (note?: string) => Promise<void>;
};

const SURFACE: React.CSSProperties = {
  background: "rgba(17,19,24,0.98)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
};

/** Demande d'entraînement (joueur) — surface sobre (direction v0). */
export function TrainingRequestButton({ pending, onRequestTraining }: Props) {
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!onRequestTraining) return null;

  function submit() {
    if (!onRequestTraining) return;
    startTransition(async () => {
      try {
        await onRequestTraining(note.trim() || undefined);
        setNote("");
        setFeedback("Demande envoyée au MJ.");
        setTimeout(() => setFeedback(null), 3000);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        setFeedback(`Erreur : ${msg}`);
      }
    });
  }

  if (pending) {
    return (
      <section
        className="overflow-hidden rounded-xl border border-border"
        style={SURFACE}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-foreground-subtle">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] tracking-widest text-foreground-muted">
              En attente
            </span>
            Entraînement
          </h2>
          <span className="font-mono text-[10px] text-foreground-subtle">
            <RelativeTime date={pending.requestedAt} />
          </span>
        </div>
        <div className="p-5">
          <p className="text-sm text-foreground-muted">
            Ta demande est en cours d&apos;examen par le MJ.
          </p>
          {pending.note && (
            <p className="mt-3 rounded-md border border-border bg-white/[0.02] p-3 text-xs italic text-foreground-subtle">
              «&nbsp;{pending.note}&nbsp;»
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-xl border border-border"
      style={SURFACE}
    >
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="text-[11px] font-medium uppercase tracking-widest text-foreground-subtle">
          Entraînement endurance
        </h2>
        <p className="mt-1 text-xs text-foreground-subtle">
          Demande au MJ d&apos;ajouter un entraînement. Si approuvé, ton palier
          évoluera vers le seuil suivant.
        </p>
      </div>
      <div className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="(Optionnel) course, sparring, méditation…"
            className="flex-1"
          />
          <Button type="button" disabled={isPending} onClick={submit}>
            {isPending ? "Envoi…" : "Demander"}
          </Button>
        </div>
        {feedback && (
          <p className="mt-3 text-xs text-foreground-subtle">{feedback}</p>
        )}
      </div>
    </section>
  );
}

function RelativeTime({ date }: { date: Date }) {
  const ms = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return <>à l&apos;instant</>;
  if (minutes < 60) return <>il y a {minutes} min</>;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return <>il y a {hours} h</>;
  const days = Math.floor(hours / 24);
  return <>il y a {days} j</>;
}
