"use client";

/**
 * ModificationsPanel — édition MJ complète d'un personnage (bouton +
 * modale). Identité, vitaux courants + max (override), progression,
 * entraînements, présence, compétences. Réservé MJ (rendu côté /mj).
 */

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import {
  updateCharacterFull,
  deleteCharacter,
  type FullCharacterPatch,
} from "@/lib/actions";
import { SKILL_GROUPS } from "@/lib/skills";
import { AvatarUpload } from "@/components/character-sheet/AvatarUpload";
import type { Character } from "@/components/character-sheet/types";

type Form = {
  name: string;
  nom: string;
  age: number;
  race: string;
  pronouns: string;
  charClass: string;
  avatarUrl: string;
  bio: string;
  notes: string;
  xp: number;
  enduranceTrainings: number;
  fluxTrainings: number;
  technicalTrainings: number;
  combatsReal: number;
  fatePoints: number;
  currentHp: number;
  currentMental: number;
  currentEndurance: number;
  currentFlux: number;
  maxHpOverride: string;
  maxMentalOverride: string;
  maxEnduranceOverride: string;
  maxFluxOverride: string;
  isPresent: boolean;
  skills: Record<string, number>;
};

function initForm(c: Character): Form {
  return {
    name: c.name,
    nom: c.nom,
    age: c.age,
    race: c.race ?? "",
    pronouns: c.pronouns ?? "",
    charClass: c.charClass ?? "",
    avatarUrl: c.avatarUrl ?? "",
    bio: c.bio ?? "",
    notes: c.notes ?? "",
    xp: c.xp,
    enduranceTrainings: c.enduranceTrainings,
    fluxTrainings: c.fluxTrainings,
    technicalTrainings: c.technicalTrainings,
    combatsReal: c.combatsReal,
    fatePoints: c.fatePoints,
    currentHp: c.currentHp,
    currentMental: c.currentMental,
    currentEndurance: c.currentEndurance,
    currentFlux: c.currentFlux,
    maxHpOverride: c.maxHpOverride != null ? String(c.maxHpOverride) : "",
    maxMentalOverride: c.maxMentalOverride != null ? String(c.maxMentalOverride) : "",
    maxEnduranceOverride: c.maxEnduranceOverride != null ? String(c.maxEnduranceOverride) : "",
    maxFluxOverride: c.maxFluxOverride != null ? String(c.maxFluxOverride) : "",
    isPresent: c.isPresent,
    skills: { ...c.skills },
  };
}

const inp =
  "h-8 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none";
const lbl = "font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle";

export function ModificationsPanel({ character }: { character: Character }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-primary/35 bg-primary/12 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-primary transition-colors hover:bg-primary/20"
      >
        <SlidersHorizontal size={13} /> Modifications
      </button>
      {open && (
        <Editor
          character={character}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function Editor({
  character,
  onClose,
}: {
  character: Character;
  onClose: () => void;
}) {
  const router = useRouter();
  const [f, setF] = useState<Form>(() => initForm(character));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setF((p) => ({ ...p, [k]: v }));
  const num = (s: string) => Math.max(0, Math.round(Number(s) || 0));

  const save = () => {
    const patch: FullCharacterPatch = {
      name: f.name,
      nom: f.nom,
      age: f.age,
      race: f.race,
      pronouns: f.pronouns,
      charClass: f.charClass,
      avatarUrl: f.avatarUrl,
      bio: f.bio,
      notes: f.notes,
      xp: f.xp,
      enduranceTrainings: f.enduranceTrainings,
      fluxTrainings: f.fluxTrainings,
      technicalTrainings: f.technicalTrainings,
      combatsReal: f.combatsReal,
      fatePoints: f.fatePoints,
      currentHp: f.currentHp,
      currentMental: f.currentMental,
      currentEndurance: f.currentEndurance,
      currentFlux: f.currentFlux,
      maxHpOverride: f.maxHpOverride === "" ? null : num(f.maxHpOverride),
      maxMentalOverride: f.maxMentalOverride === "" ? null : num(f.maxMentalOverride),
      maxEnduranceOverride:
        f.maxEnduranceOverride === "" ? null : num(f.maxEnduranceOverride),
      maxFluxOverride: f.maxFluxOverride === "" ? null : num(f.maxFluxOverride),
      isPresent: f.isPresent,
      skills: f.skills,
    };
    startTransition(async () => {
      const res = await updateCharacterFull(character.id, patch);
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      toast.success("Personnage mis à jour");
      router.refresh();
      onClose();
    });
  };

  // Suppression du personnage (zone de danger). 1er clic = arme la confirmation,
  // 2e clic = supprime. Chemin fiable (modale custom, pas le Dialog radix).
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    startTransition(async () => {
      const res = await deleteCharacter(character.id);
      if (!res.ok) {
        toast.error(res.reason);
        setConfirmingDelete(false);
        return;
      }
      toast.success(`« ${res.name} » supprimé`);
      onClose();
      router.push("/mj");
      router.refresh();
    });
  };

  const N = (k: keyof Form, label: string, hint?: string) => (
    <label className="flex flex-col gap-1">
      <span className={lbl}>{label}</span>
      <input
        type="number"
        value={f[k] as number}
        onChange={(e) => set(k, num(e.target.value) as never)}
        className={`${inp} font-mono tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
      />
      {hint && <span className="text-[10px] text-foreground-subtle">{hint}</span>}
    </label>
  );
  const Over = (k: keyof Form, label: string, derived: number) => (
    <label className="flex flex-col gap-1">
      <span className={lbl}>{label}</span>
      <input
        type="number"
        value={f[k] as string}
        placeholder={`auto ${derived}`}
        onChange={(e) => set(k, e.target.value as never)}
        className={`${inp} font-mono tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
      />
    </label>
  );
  const T = (k: keyof Form, label: string) => (
    <label className="flex flex-col gap-1">
      <span className={lbl}>{label}</span>
      <input
        type="text"
        value={f[k] as string}
        onChange={(e) => set(k, e.target.value as never)}
        className={inp}
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-none bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-6 w-full max-w-3xl rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <header className="sticky top-0 flex items-center justify-between gap-2 rounded-t-xl border-b border-border bg-card px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <SlidersHorizontal size={15} className="text-primary" />
            Modifications — {character.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-foreground-subtle transition-colors hover:text-foreground"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex flex-col gap-6 p-5">
          {/* Identité */}
          <Section title="Identité">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {T("name", "Prénom")}
              {T("nom", "Nom")}
              {N("age", "Âge")}
              {T("race", "Race")}
              {T("pronouns", "Pronoms")}
              {T("charClass", "Classe")}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className={lbl}>Portrait</span>
                <AvatarUpload
                  name={f.name}
                  value={f.avatarUrl}
                  onChange={(v) => set("avatarUrl", v)}
                />
                <input
                  type="url"
                  value={f.avatarUrl.startsWith("data:") ? "" : f.avatarUrl}
                  placeholder="ou URL https://…"
                  onChange={(e) => set("avatarUrl", e.target.value)}
                  className={inp}
                />
              </div>
              <label className="flex flex-col gap-1">
                <span className={lbl}>Bio</span>
                <textarea
                  rows={2}
                  value={f.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  className={`${inp} h-auto resize-none py-1.5`}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={lbl}>Notes</span>
                <textarea
                  rows={2}
                  value={f.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  className={`${inp} h-auto resize-none py-1.5`}
                />
              </label>
            </div>
          </Section>

          {/* Vitaux */}
          <Section title="Vitaux — courant / max (vide = auto)">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {N("currentHp", "PV courant")}
              {N("currentMental", "PM courant")}
              {N("currentEndurance", "END courant")}
              {N("currentFlux", "Flux courant")}
              {Over("maxHpOverride", "PV max", character.maxHp)}
              {Over("maxMentalOverride", "PM max", character.maxMental)}
              {Over("maxEnduranceOverride", "END max", character.maxEndurance)}
              {Over("maxFluxOverride", "Flux max", character.maxFlux)}
            </div>
          </Section>

          {/* Progression */}
          <Section title="Progression & entraînements">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {N("xp", "XP total")}
              {N("combatsReal", "Combats réels")}
              {N("enduranceTrainings", "Entraîn. endurance")}
              {N("fluxTrainings", "Entraîn. flux")}
              {N("technicalTrainings", "Entraîn. technique")}
            </div>
            <label className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={f.isPresent}
                onChange={(e) => set("isPresent", e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              <span className="text-sm text-foreground-muted">Présent à la table</span>
            </label>
          </Section>

          {/* Compétences */}
          <Section title="Compétences">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(Object.keys(SKILL_GROUPS) as (keyof typeof SKILL_GROUPS)[]).map(
                (attr) => (
                  <div key={attr}>
                    <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-muted">
                      {attr}
                    </p>
                    <div className="flex flex-col gap-1">
                      {SKILL_GROUPS[attr].map((sk) => (
                        <label key={sk} className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-foreground-muted">{sk}</span>
                          <input
                            type="number"
                            value={f.skills[sk] ?? 0}
                            onChange={(e) =>
                              set("skills", {
                                ...f.skills,
                                [sk]: num(e.target.value),
                              })
                            }
                            className="h-7 w-14 rounded-md border border-border bg-background text-center font-mono text-xs tabular-nums text-foreground outline-none focus:border-primary/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </Section>
        </div>

        {/* Footer */}
        <footer className="sticky bottom-0 flex items-center justify-end gap-2 rounded-b-xl border-t border-border bg-card px-5 py-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className={`mr-auto rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
              confirmingDelete
                ? "border-destructive bg-destructive text-white hover:bg-destructive/90"
                : "border-destructive/40 text-destructive hover:bg-destructive/10"
            }`}
          >
            {confirmingDelete
              ? "Confirmer la suppression définitive"
              : "Supprimer le personnage"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-foreground-subtle transition-colors hover:text-foreground"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-md bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
        {title}
      </h3>
      {children}
    </section>
  );
}
