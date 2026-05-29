"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <Card size="sm">
        <CardHeader className="grid-cols-[1fr_auto] items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline">En attente</Badge>
            <CardTitle className="text-sm">Entraînement</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">
            <RelativeTime date={pending.requestedAt} />
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted">
            Ta demande est en cours d&apos;examen par le MJ.
          </p>
          {pending.note && (
            <p className="mt-3 rounded-md border border-border bg-muted p-3 text-xs italic text-muted-foreground">
              «&nbsp;{pending.note}&nbsp;»
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Entraînement endurance</CardTitle>
        <CardDescription>
          Demande au MJ d&apos;ajouter un entraînement à ton compteur. Si
          approuvé, ton palier évoluera vers le seuil suivant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="(Optionnel) Précise pourquoi : course, sparring, méditation…"
            className="flex-1"
          />
          <Button type="button" disabled={isPending} onClick={submit}>
            {isPending ? "Envoi…" : "Demander"}
          </Button>
        </div>
        {feedback && (
          <p className="mt-3 text-xs text-muted-foreground">{feedback}</p>
        )}
      </CardContent>
    </Card>
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
