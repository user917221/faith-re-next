"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <section
      className="overflow-hidden rounded-xl border border-border"
      style={{
        background: "rgba(17,19,24,0.98)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="text-[11px] font-medium uppercase tracking-widest text-foreground-subtle">
          Profil — identité
        </h2>
        {feedback && (
          <span className="font-mono text-[10px] text-foreground-subtle">
            {feedback}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 p-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-name" className="text-foreground-muted">
            Prénom <span className="text-foreground-subtle">*</span>
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
          <Label htmlFor="profile-nom" className="text-foreground-muted">
            Nom de famille
          </Label>
          <Input
            id="profile-nom"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            disabled={!onProfileChange}
          />
        </div>
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
            disabled={!onProfileChange}
            className="tabular-nums"
          />
        </div>
        <Button
          type="button"
          className="w-full"
          disabled={!onProfileChange || !dirty || isPending}
          onClick={save}
        >
          {isPending ? "…" : "Enregistrer"}
        </Button>
      </div>
    </section>
  );
}
