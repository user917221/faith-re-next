"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import CharacterSheet from "@/components/character-sheet";
import type {
  Character,
  PendingTrainingRequest,
  ProfilePatch,
} from "@/components/character-sheet/types";
import {
  updateSkill,
  updateVital,
  applyEnduranceAction,
  updateFatePoints,
  updateRunes,
  updateProfile,
  requestTraining,
} from "@/lib/actions";

export function MyCharacterClient({
  character,
  userName,
  pendingTraining,
}: {
  character: Character;
  userName: string;
  pendingTraining: PendingTrainingRequest | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  return (
    <main className="min-h-screen bg-[#0a0c15] px-6 py-10 text-white">
      <header className="mx-auto mb-8 max-w-6xl flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">Ma fiche</p>
          <h1 className="text-2xl font-bold">
            {character.name}
            {character.nom && <span className="text-white/60"> {character.nom}</span>}
          </h1>
        </div>
        <p className="text-sm text-white/40">Connecté : {userName}</p>
      </header>
      <div className="mx-auto max-w-6xl">
        <CharacterSheet
          character={character}
          isMJ={false}
          pendingTraining={pendingTraining}
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
          onRequestTraining={async (note) => {
            const res = await requestTraining(character.id, note);
            if (!res.ok) throw new Error(res.reason);
            refresh();
          }}
        />
      </div>
    </main>
  );
}
