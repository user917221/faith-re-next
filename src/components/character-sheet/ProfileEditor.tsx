"use client";

import { useState, useTransition } from "react";
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
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">
            Profil
          </h3>
          <p className="mt-0.5 text-xs text-white/40">Identité du personnage</p>
        </div>
        {feedback && <span className="text-xs text-cyan-300">{feedback}</span>}
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Field label="Prénom" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!onProfileChange}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          />
        </Field>
        <Field label="Nom de famille">
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            disabled={!onProfileChange}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
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
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          />
        </Field>
        <div className="flex items-end">
          <button
            type="button"
            disabled={!onProfileChange || !dirty || isPending}
            onClick={save}
            className="h-10 w-full rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
        {label}
        {required && <span className="ml-1 text-rose-400">*</span>}
      </span>
      {children}
    </label>
  );
}
