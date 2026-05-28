"use client";

import { useState, useTransition } from "react";
import type { PendingTrainingRequest } from "./types";

type Props = {
  pending?: PendingTrainingRequest | null;
  onRequestTraining?: (note?: string) => Promise<void>;
};

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
      <section className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.04] p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
          🏋️ Entraînement en attente
        </h3>
        <p className="mt-2 text-sm text-white/70">
          Ta demande est en cours d&apos;examen par le MJ. Demandé{" "}
          <RelativeTime date={pending.requestedAt} />.
        </p>
        {pending.note && (
          <p className="mt-2 rounded-lg border border-white/10 bg-black/20 p-3 text-xs italic text-white/60">
            « {pending.note} »
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <header className="mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">
          🏋️ Entraînement Endurance
        </h3>
        <p className="mt-0.5 text-xs text-white/40">
          Demande au MJ d&apos;ajouter un entraînement à ton compteur. Si approuvé,
          ton palier d&apos;endurance évoluera vers le seuil suivant.
        </p>
      </header>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="(Optionnel) Précise pourquoi : course, sparring, méditation…"
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={submit}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Envoi…" : "Demander un entraînement"}
        </button>
      </div>
      {feedback && (
        <p className="mt-3 text-xs text-cyan-300">{feedback}</p>
      )}
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
