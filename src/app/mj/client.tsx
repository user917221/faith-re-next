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
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/40">
        Aucune demande d&apos;entraînement en attente.
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/[0.05] p-5">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300">
          🏋️ Demandes d&apos;entraînement en attente
        </h2>
        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-200">
          {requests.length}
        </span>
      </header>
      <ul className="flex flex-col gap-3">
        {requests.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-white">
                {r.characterName}
                {r.requesterName && (
                  <span className="ml-2 text-xs font-normal text-white/40">
                    par {r.requesterName}
                  </span>
                )}
              </p>
              {r.note && (
                <p className="mt-1 text-xs italic text-white/60">« {r.note} »</p>
              )}
              <p className="mt-1 text-xs text-white/40">
                {new Date(r.requestedAt).toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(async () => { await approveTraining(r.id); refresh(); })}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-40"
              >
                Approuver (+1)
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(async () => { await rejectTraining(r.id); refresh(); })}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-40"
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
