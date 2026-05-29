"use client";

import { useState, useTransition } from "react";
import { CrestGlyph } from "@/components/glyphs";
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
    <section className="card-grimoire">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-gold-soft">
            <CrestGlyph size={42} />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="label-grimoire">Profil</span>
            <p className="text-xs text-parchment-mute">
              Identité du personnage
            </p>
          </div>
        </div>
        {feedback && (
          <span className="text-xs italic text-gold-bright">{feedback}</span>
        )}
      </header>
      <div className="flex flex-col gap-3">
        <Field label="Prénom" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!onProfileChange}
            className="input-grimoire w-full disabled:opacity-40"
          />
        </Field>
        <Field label="Nom de famille">
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            disabled={!onProfileChange}
            className="input-grimoire w-full disabled:opacity-40"
          />
        </Field>
        <Field label="Âge">
          <input
            type="number"
            min={1}
            max={999}
            value={age}
            onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
            disabled={!onProfileChange}
            className="input-grimoire tabular w-full disabled:opacity-40"
          />
        </Field>
        <button
          type="button"
          disabled={!onProfileChange || !dirty || isPending}
          onClick={save}
          className="btn-grimoire h-10 w-full"
        >
          {isPending ? "…" : "Enregistrer"}
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-display text-[0.65rem] uppercase tracking-[0.18em] text-parchment-mute">
        {label}
        {required && <span className="ml-1 text-blood-dried">*</span>}
      </span>
      {children}
    </label>
  );
}
