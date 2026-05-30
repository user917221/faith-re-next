"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { AvatarUpload } from "./AvatarUpload";
import type { Character, ProfilePatch } from "./types";

type Props = {
  character: Character;
  onProfileChange?: (patch: ProfilePatch) => Promise<void>;
};

/** Édition d'identité du personnage — surface sobre (direction v0). */
export function ProfileEditor({ character, onProfileChange }: Props) {
  const [name, setName] = useState(character.name);
  const [nom, setNom] = useState(character.nom);
  const [age, setAge] = useState(character.age);
  const [race, setRace] = useState(character.race ?? "");
  const [pronouns, setPronouns] = useState(character.pronouns ?? "");
  const [charClass, setCharClass] = useState(character.charClass ?? "");
  const [bio, setBio] = useState(character.bio ?? "");
  const [notes, setNotes] = useState(character.notes ?? "");
  const [avatarUrl, setAvatarUrl] = useState(character.avatarUrl ?? "");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const dirty =
    name.trim() !== character.name ||
    nom.trim() !== character.nom ||
    age !== character.age ||
    race.trim() !== (character.race ?? "") ||
    pronouns.trim() !== (character.pronouns ?? "") ||
    charClass.trim() !== (character.charClass ?? "") ||
    bio.trim() !== (character.bio ?? "") ||
    notes.trim() !== (character.notes ?? "") ||
    avatarUrl.trim() !== (character.avatarUrl ?? "");

  function save() {
    if (!onProfileChange || !dirty) return;
    startTransition(async () => {
      await onProfileChange({
        name: name.trim(),
        nom: nom.trim(),
        age,
        race: race.trim(),
        pronouns: pronouns.trim(),
        charClass: charClass.trim(),
        bio: bio.trim(),
        notes: notes.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      setFeedback("Profil sauvegardé.");
      setTimeout(() => setFeedback(null), 2000);
    });
  }

  return (
    <section
      className="campaign-panel"
    >
      <div className="campaign-header-line flex items-center justify-between px-5 py-3.5">
        <h2 className="eyebrow">
          Profil — identité
        </h2>
        {feedback && (
          <span className="font-mono text-[10px] text-foreground-subtle">
            {feedback}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-name" className="text-foreground-muted">
              Prénom <span className="text-foreground-subtle">*</span>
            </Label>
            <Input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!onProfileChange || isPending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-nom" className="text-foreground-muted">
              Nom de famille
            </Label>
            <Input
              id="profile-nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              disabled={!onProfileChange || isPending}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-race" className="text-foreground-muted">
              Race / espèce
            </Label>
            <Input
              id="profile-race"
              type="text"
              value={race}
              maxLength={40}
              placeholder="—"
              onChange={(e) => setRace(e.target.value)}
              disabled={!onProfileChange || isPending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-pronouns" className="text-foreground-muted">
              Pronoms
            </Label>
            <Input
              id="profile-pronouns"
              type="text"
              value={pronouns}
              maxLength={40}
              placeholder="—"
              onChange={(e) => setPronouns(e.target.value)}
              disabled={!onProfileChange || isPending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-class" className="text-foreground-muted">
              Classe / rôle
            </Label>
            <Input
              id="profile-class"
              type="text"
              value={charClass}
              maxLength={40}
              placeholder="—"
              onChange={(e) => setCharClass(e.target.value)}
              disabled={!onProfileChange || isPending}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground-muted">Portrait</Label>
          <AvatarUpload
            name={name}
            value={avatarUrl}
            onChange={setAvatarUrl}
            disabled={!onProfileChange || isPending}
          />
          <Input
            id="profile-avatar"
            type="url"
            value={avatarUrl.startsWith("data:") ? "" : avatarUrl}
            maxLength={500}
            placeholder="ou colle une URL https://…"
            onChange={(e) => setAvatarUrl(e.target.value)}
            disabled={!onProfileChange || isPending}
            className="font-mono text-xs"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-bio" className="text-foreground-muted">
            Bio / historique
          </Label>
          <Textarea
            id="profile-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={!onProfileChange || isPending}
            rows={3}
            maxLength={1000}
            placeholder="Quelques lignes sur le passé du personnage…"
            className="resize-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-notes" className="text-foreground-muted">
            Notes personnelles
          </Label>
          <Textarea
            id="profile-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!onProfileChange || isPending}
            rows={2}
            maxLength={1000}
            placeholder="Notes privées du joueur…"
            className="resize-none"
          />
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-age" className="text-foreground-muted">
              Âge
            </Label>
            <Input
              id="profile-age"
              type="number"
              min={1}
              max={999}
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
              disabled={!onProfileChange || isPending}
              className="w-24 font-mono tabular-nums slashed-zero"
            />
          </div>
          <Button
            type="button"
            disabled={!onProfileChange || !dirty || isPending}
            onClick={save}
            className="gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </section>
  );
}
