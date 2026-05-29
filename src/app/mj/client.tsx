"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import CharacterSheet from "@/components/character-sheet";
import type { Character, ProfilePatch } from "@/components/character-sheet/types";
import { GrimoireGlyph } from "@/components/glyphs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  recoverHp,
  recoverEndurance,
  togglePresence,
  rollSkillWithDD,
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
      onRecoverHp={async () => {
        const res = await recoverHp(character.id);
        if (!res.ok) throw new Error(res.reason);
        refresh();
        const { gain, d1, d2, ecaille, newHp, maxHp } = res;
        return { gain, d1, d2, ecaille, newHp, maxHp };
      }}
      onRecoverEndurance={async () => {
        const res = await recoverEndurance(character.id);
        if (!res.ok) throw new Error(res.reason);
        refresh();
        const { gain, roll, newEndurance, maxEndurance } = res;
        return { gain, roll, newEndurance, maxEndurance };
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
  );
}

export function PendingTrainingPanel({ requests }: { requests: TrainingRequestWithChar[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  return (
    <div className="h-full overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex items-center gap-4 border-b border-border px-5 py-4">
        <GrimoireGlyph
          size={36}
          className={`shrink-0 ${
            requests.length > 0 ? "text-muted-foreground" : "text-ink-tertiary"
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="label-grimoire">Entraînements en attente</p>
          <h2 className="mt-0.5 text-base font-medium tracking-tight text-foreground">
            File d&apos;approbation
          </h2>
        </div>
        <Badge
          variant={requests.length > 0 ? "default" : "outline"}
          className="tabular shrink-0"
        >
          {requests.length}
        </Badge>
      </header>

      {requests.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="label-grimoire">File vide</p>
          <p className="mt-2 text-sm text-ink-tertiary">
            Aucune demande d&apos;entraînement en attente.
          </p>
        </div>
      ) : (
        <ul className="list-portfolio" aria-label="Demandes d'entraînement">
          {requests.map((r) => (
            <li key={r.id} className="!py-3 !px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-2 text-sm font-medium tracking-tight text-foreground">
                    <span>{r.characterName}</span>
                    {r.requesterName && (
                      <span className="text-xs font-normal text-ink-tertiary">
                        par <span className="text-muted-foreground">{r.requesterName}</span>
                      </span>
                    )}
                  </p>
                  {r.note && (
                    <p className="mt-1 truncate text-xs italic text-muted-foreground">
                      «&nbsp;{r.note}&nbsp;»
                    </p>
                  )}
                  <p className="tabular mt-1 text-[0.62rem] text-ink-tertiary">
                    {new Date(r.requestedAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    onClick={() => startTransition(async () => { await approveTraining(r.id); refresh(); })}
                  >
                    Approuver +1
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => startTransition(async () => { await rejectTraining(r.id); refresh(); })}
                  >
                    Refuser
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
