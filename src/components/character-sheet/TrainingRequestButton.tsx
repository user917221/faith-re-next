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
      <section
        className="card-grimoire"
        style={{ borderColor: "rgba(17, 17, 17, 0.3)" }}
      >
        <header className="flex items-baseline justify-between gap-3">
          <span className="label-grimoire !text-gold-bright">
            ⚜ Entraînement en attente
          </span>
          <span className="text-[0.7rem] italic text-parchment-mute">
            <RelativeTime date={pending.requestedAt} />
          </span>
        </header>
        <p className="mt-2 text-sm text-parchment-dim">
          Ta demande est en cours d&apos;examen par le MJ.
        </p>
        {pending.note && (
          <p className="mt-3 rounded-[--radius-sm] border border-gold-aged/10 bg-ink-deep p-3 text-xs italic text-parchment-mute">
            «&nbsp;{pending.note}&nbsp;»
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="card-grimoire">
      <header className="mb-3 flex flex-col gap-1">
        <span className="label-grimoire">Entraînement endurance</span>
        <p className="text-xs text-parchment-mute">
          Demande au MJ d&apos;ajouter un entraînement à ton compteur. Si approuvé, ton
          palier évoluera vers le seuil suivant.
        </p>
      </header>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="(Optionnel) Précise pourquoi : course, sparring, méditation…"
          className="input-grimoire flex-1"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={submit}
          className="btn-grimoire"
        >
          {isPending ? "Envoi…" : "Demander un entraînement"}
        </button>
      </div>
      {feedback && (
        <p className="mt-3 text-xs italic text-gold-bright">{feedback}</p>
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
