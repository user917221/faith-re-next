"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import CharacterSheet from "@/components/character-sheet";
import type {
  Character,
  PendingTrainingRequest,
  ProfilePatch,
} from "@/components/character-sheet/types";
import { ENDURANCE_COSTS } from "@/lib/faith-system";
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
  pendingTraining,
}: {
  character: Character;
  pendingTraining: PendingTrainingRequest | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  return (
    <CharacterSheet
      character={character}
      isMJ={false}
      pendingTraining={pendingTraining}
      onSkillChange={async (skillName, delta) => {
        await updateSkill(character.id, skillName, delta);
        toast.success(`${skillName} ${delta > 0 ? "+1" : "-1"}`);
        refresh();
      }}
      onVitalChange={async (type, delta) => {
        await updateVital(character.id, type, delta);
        toast(`${type} ${delta > 0 ? "+" : ""}${delta}`);
        refresh();
      }}
      onActionCost={async (actionType) => {
        await applyEnduranceAction(character.id, actionType);
        toast("Endurance dépensée", {
          description: ENDURANCE_COSTS[actionType].label,
        });
        refresh();
      }}
      onProfileChange={async (patch: ProfilePatch) => {
        await updateProfile(character.id, patch);
        toast.success("Profil enregistré");
        refresh();
      }}
      onRequestTraining={async (note) => {
        const res = await requestTraining(character.id, note);
        if (!res.ok) throw new Error(res.reason);
        toast.success("Demande envoyée au MJ");
        refresh();
      }}
      onTogglePresence={async () => {
        const wasPresent = character.isPresent;
        await togglePresence(character.id);
        toast(wasPresent ? "Tu quittes la table" : "Tu rejoins la table");
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
  );
}
