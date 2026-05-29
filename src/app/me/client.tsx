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
  updateProfile,
  requestTraining,
  togglePresence,
  rollSkillWithDD,
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
    <main className="relative z-[2] min-h-screen px-6 py-8">
      {/* Nav top */}
      <div className="mx-auto mb-6 flex max-w-7xl items-center justify-between gap-4">
        <Link
          href="/plateau"
          className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim transition-colors hover:text-gold-aged"
        >
          ← Plateau
        </Link>
        <p className="text-xs text-parchment-mute">
          Connecté&nbsp;:{" "}
          <span className="text-parchment-dim">{userName}</span>
        </p>
      </div>

      <div className="mx-auto max-w-7xl">
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
          onProfileChange={async (patch: ProfilePatch) => {
            await updateProfile(character.id, patch);
            refresh();
          }}
          onRequestTraining={async (note) => {
            const res = await requestTraining(character.id, note);
            if (!res.ok) throw new Error(res.reason);
            refresh();
          }}
          onTogglePresence={async () => {
            await togglePresence(character.id);
            refresh();
          }}
          onRollSkill={async ({ attrName, skillName, dd }) => {
            await rollSkillWithDD({
              characterId: character.id,
              attrName,
              skillName: skillName ?? null,
              dd,
            });
            refresh();
          }}
        />
      </div>
    </main>
  );
}
