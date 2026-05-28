"use client";

import Link from "next/link";
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
    <main className="relative z-[2] min-h-screen px-6 py-10">
      <div className="mx-auto mb-4 max-w-6xl">
        <Link
          href="/plateau"
          className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim transition-colors hover:text-gold-aged"
        >
          ← Plateau
        </Link>
      </div>
      <header className="mx-auto mb-8 max-w-6xl flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.22em] text-gold-aged">
            Ma fiche
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-wide text-parchment">
            {character.name}
            {character.nom && (
              <span className="text-parchment-dim"> {character.nom}</span>
            )}
          </h1>
        </div>
        <p className="text-xs text-parchment-mute">
          Connecté&nbsp;: <span className="text-parchment-dim">{userName}</span>
        </p>
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
