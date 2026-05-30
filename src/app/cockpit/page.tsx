"use client";

/**
 * /cockpit — APERÇU PUBLIC du cockpit MJ (mock data, sans auth).
 * Banc d'essai visuel : consomme le MÊME <CockpitShell> que /mj, avec un roster
 * et une fiche mock interactifs.
 */

import { useCallback, useState } from "react";
import CharacterSheet from "@/components/character-sheet";
import type { Character, VitalType } from "@/components/character-sheet/types";
import { ALL_SKILLS } from "@/lib/skills";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { avatarFallbackStyle, initialsOf } from "@/lib/avatar";
import { CockpitShell } from "@/components/cockpit/CockpitShell";

const SKILLS = Object.fromEntries(ALL_SKILLS.map((s) => [s, 1]));

function mk(id: string, name: string, hp: number, maxHp: number): Character {
  return {
    id,
    name,
    nom: "",
    age: 25,
    xp: 2500,
    level: 3,
    enduranceTrainings: 5,
    currentHp: hp,
    currentMental: Math.round(maxHp * 0.8),
    currentEndurance: 750,
    maxHp,
    maxMental: maxHp,
    maxEndurance: 750,
    fatePoints: 2,
    runes: ["", "", ""],
    skills: SKILLS,
    isPresent: true,
    avatarUrl: null,
    fluxTrainings: 5,
    technicalTrainings: 3,
    combatsReal: 3,
    currentFlux: 600,
    maxFlux: 750,
    fluxPalier: 2,
    fluxLabel: "P2",
    technicalPalier: 1,
    technicalLabel: "Initié",
    tier: "T3",
    runesInventory: [],
  };
}

const INITIAL: Character[] = [
  mk("c1", "Seraphina", 42, 42),
  mk("c2", "Darius", 56, 56),
  mk("c3", "Mira", 38, 38),
  mk("c4", "Joric", 29, 36),
  mk("c5", "Elowen", 31, 31),
  mk("c6", "Calder", 27, 27),
];

export default function CockpitPreview() {
  const [chars, setChars] = useState<Character[]>(INITIAL);
  const [selId, setSelId] = useState("c1");
  const selected = chars.find((c) => c.id === selId) ?? chars[0];

  const patch = useCallback(
    (id: string, fn: (c: Character) => Character) =>
      setChars((cs) => cs.map((c) => (c.id === id ? fn(c) : c))),
    [],
  );

  const onVitalChange = useCallback(
    async (type: VitalType, delta: number) => {
      patch(selId, (c) => {
        if (type === "hp")
          return { ...c, currentHp: Math.max(0, Math.min(c.maxHp, c.currentHp + delta)) };
        if (type === "mental")
          return {
            ...c,
            currentMental: Math.max(0, Math.min(c.maxMental, c.currentMental + delta)),
          };
        return {
          ...c,
          currentEndurance: Math.max(0, Math.min(c.maxEndurance, c.currentEndurance + delta)),
        };
      });
    },
    [patch, selId],
  );

  const onSkillChange = useCallback(
    async (skillName: string, delta: 1 | -1) => {
      patch(selId, (c) => ({
        ...c,
        skills: { ...c.skills, [skillName]: Math.max(0, (c.skills[skillName] ?? 0) + delta) },
      }));
    },
    [patch, selId],
  );

  const onFluxChange = useCallback(
    async (delta: number) => {
      patch(selId, (c) => ({
        ...c,
        currentFlux: Math.max(0, Math.min(c.maxFlux, c.currentFlux + delta)),
      }));
    },
    [patch, selId],
  );

  return (
    <CockpitShell
      user={{ name: "Game Master", role: "mj", image: null }}
      roster={
        <div className="campaign-panel">
          <div className="campaign-header-line flex items-center justify-between px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
              Roster
            </p>
            <span className="font-mono text-[10px] tabular-nums text-foreground-subtle">
              {chars.length}/{chars.length} présents
            </span>
          </div>
          <div className="flex flex-col gap-1 p-2">
            {chars.map((c) => {
              const active = c.id === selId;
              const low = c.currentHp / c.maxHp < 0.5;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelId(c.id)}
                  className={`flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors ${
                    active
                      ? "border-primary/30 bg-primary/10"
                      : "border-transparent hover:border-border hover:bg-surface-overlay"
                  }`}
                >
                  <Avatar className="size-8 rounded-md">
                    <AvatarFallback
                      className="rounded-md text-[11px]"
                      style={avatarFallbackStyle(c.name)}
                    >
                      {initialsOf(c.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                    <p
                      className="font-mono text-[10px] tabular-nums slashed-zero"
                      style={{ color: low ? "var(--hp)" : "var(--foreground-subtle)" }}
                    >
                      {c.currentHp}/{c.maxHp}
                    </p>
                  </div>
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: "#5c7d63" }}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </div>
      }
    >
      <CharacterSheet
        character={selected}
        isMJ
        onVitalChange={onVitalChange}
        onSkillChange={onSkillChange}
        onFluxChange={onFluxChange}
      />
    </CockpitShell>
  );
}
