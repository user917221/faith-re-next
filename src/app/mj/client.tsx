"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import CharacterSheet from "@/components/character-sheet";
import type { Character, ProfilePatch } from "@/components/character-sheet/types";
import {
  updateSkill,
  updateVital,
  applyEnduranceAction,
  updateXp,
  updateTrainings,
  updateFatePoints,
  updateRunes,
  updateProfile,
  approveTraining,
  rejectTraining,
  type TrainingRequestWithChar,
} from "@/lib/actions";

export function MJCharacterClient({ character }: { character: Character }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  return (
    <CharacterSheet
      character={character}
      isMJ={true}
      onSkillChange={async (skillName, delta) => {
        await updateSkill(character.id, skillName, delta);
        refresh();
      }}
      onVitalChange={async (type, delta) => {
        await updateVital(character.id, type, delta);
        refresh();
      }}
      onActionCost={async (actionType) => {
        await applyEnduranceAction(character.id, actionType);
        refresh();
      }}
      onXpChange={async (newXp) => {
        await updateXp(character.id, newXp);
        refresh();
      }}
      onTrainingChange={async (delta) => {
        await updateTrainings(character.id, delta);
        refresh();
      }}
      onFateChange={async (value) => {
        await updateFatePoints(character.id, value);
        refresh();
      }}
      onRuneChange={async (index, value) => {
        const next = [...character.runes];
        next[index] = value;
        await updateRunes(character.id, next);
        refresh();
      }}
      onProfileChange={async (patch: ProfilePatch) => {
        await updateProfile(character.id, patch);
        refresh();
      }}
    />
  );
}

export function PendingTrainingPanel({ requests }: { requests: TrainingRequestWithChar[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  if (requests.length === 0) {
    return (
      <div className="card-grimoire mb-6 text-sm italic text-parchment-mute">
        Aucune demande d&apos;entraînement en attente.
      </div>
    );
  }

  return (
    <div
      className="card-grimoire mb-6"
      style={{ borderColor: "rgba(202, 161, 90, 0.3)" }}
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="label-grimoire !text-gold-bright">
          ⚜ Demandes d&apos;entraînement en attente
        </h2>
        <span className="font-display tabular rounded-[--radius-xs] border border-gold-aged/30 px-2 py-0.5 text-[0.65rem] text-gold-bright">
          {requests.length}
        </span>
      </header>
      <ul className="flex flex-col gap-3">
        {requests.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-3 rounded-[--radius-sm] border border-gold-aged/10 bg-ink-deep p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display text-sm tracking-wide text-parchment">
                {r.characterName}
                {r.requesterName && (
                  <span className="ml-2 text-[0.7rem] font-normal text-parchment-mute">
                    par {r.requesterName}
                  </span>
                )}
              </p>
              {r.note && (
                <p className="mt-1 text-xs italic text-parchment-dim">
                  «&nbsp;{r.note}&nbsp;»
                </p>
              )}
              <p className="tabular mt-1 text-[0.7rem] text-parchment-mute">
                {new Date(r.requestedAt).toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(async () => { await approveTraining(r.id); refresh(); })}
                className="btn-grimoire"
              >
                Approuver (+1)
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(async () => { await rejectTraining(r.id); refresh(); })}
                className="btn-ghost"
              >
                Refuser
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
