"use client";

import { useState, useTransition } from "react";
import { CrestGlyph } from "@/components/glyphs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Character, ProfilePatch } from "./types";

type Props = {
  character: Character;
  onProfileChange?: (patch: ProfilePatch) => Promise<void>;
};

export function ProfileEditor({ character, onProfileChange }: Props) {
  const [name, setName] = useState(character.name);
  const [nom, setNom] = useState(character.nom);
  const [age, setAge] = useState(character.age);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const dirty =
    name.trim() !== character.name ||
    nom.trim() !== character.nom ||
    age !== character.age;

  function save() {
    if (!onProfileChange || !dirty) return;
    startTransition(async () => {
      await onProfileChange({ name: name.trim(), nom: nom.trim(), age });
      setFeedback("Profil sauvegardé.");
      setTimeout(() => setFeedback(null), 2000);
    });
  }

  return (
    <Card className="border border-border ring-0">
      <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-3">
        <span className="shrink-0 text-ink-tertiary">
          <CrestGlyph size={36} />
        </span>
        <div className="flex flex-col gap-0.5">
          <CardTitle>Profil</CardTitle>
          <CardDescription>Identité du personnage</CardDescription>
        </div>
        {feedback && (
          <span className="self-start text-xs text-muted-foreground">{feedback}</span>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-name">
            Prénom
            <span className="text-hp">*</span>
          </Label>
          <Input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!onProfileChange}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-nom">Nom de famille</Label>
          <Input
            id="profile-nom"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            disabled={!onProfileChange}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-age">Âge</Label>
          <Input
            id="profile-age"
            type="number"
            min={1}
            max={999}
            value={age}
            onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
            disabled={!onProfileChange}
            className="tabular"
          />
        </div>
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={!onProfileChange || !dirty || isPending}
          onClick={save}
        >
          {isPending ? "…" : "Enregistrer"}
        </Button>
      </CardContent>
    </Card>
  );
}
