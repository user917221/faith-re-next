"use client";

import { useCallback, useState } from "react";
import CharacterSheet from "@/components/character-sheet";
import type {
  ActionType,
  Character,
  VitalType,
} from "@/components/character-sheet";
import { ENDURANCE_COSTS, calculateLevel } from "@/lib/faith-system";
import { ALL_SKILLS, countAllocatedPoints } from "@/lib/skills";

function buildMockBrad(): Character {
  return {
    id: "mock-brad",
    name: "Brad",
    nom: "",
    age: 25,
    xp: 2500,
    level: 3,
    enduranceTrainings: 5,
    currentHp: 125,
    currentMental: 125,
    currentEndurance: 750,
    maxHp: 125,
    maxMental: 125,
    maxEndurance: 750,
    fatePoints: 2,
    isPresent: true,
    avatarUrl: null,
    runes: ["Rune Physique (Feu)", "", ""],
    skills: Object.fromEntries(ALL_SKILLS.map((s) => [s, 1])),
  };
}

export default function PreviewPage() {
  const [character, setCharacter] = useState<Character>(buildMockBrad);
  const [isMJ, setIsMJ] = useState(true);

  // Optimistic-friendly mutators. Le composant utilise useTransition autour de
  // ces handlers, donc on simule un await microtask pour valider le pending state.
  const onSkillChange = useCallback(
    async (skillName: string, delta: 1 | -1) => {
      // eslint-disable-next-line no-console
      console.log("[preview] onSkillChange", skillName, delta);
      await Promise.resolve();
      setCharacter((c) => ({
        ...c,
        skills: {
          ...c.skills,
          [skillName]: Math.max(0, (c.skills[skillName] ?? 0) + delta),
        },
      }));
    },
    [],
  );

  const onVitalChange = useCallback(
    async (type: VitalType, delta: number) => {
      // eslint-disable-next-line no-console
      console.log("[preview] onVitalChange", type, delta);
      await Promise.resolve();
      setCharacter((c) => {
        if (type === "hp") {
          return {
            ...c,
            currentHp: Math.max(0, Math.min(c.maxHp, c.currentHp + delta)),
          };
        }
        if (type === "mental") {
          return {
            ...c,
            currentMental: Math.max(
              0,
              Math.min(c.maxMental, c.currentMental + delta),
            ),
          };
        }
        return {
          ...c,
          currentEndurance: Math.max(
            0,
            Math.min(c.maxEndurance, c.currentEndurance + delta),
          ),
        };
      });
    },
    [],
  );

  const onActionCost = useCallback(async (actionType: ActionType) => {
    const cost = ENDURANCE_COSTS[actionType].cost;
    // eslint-disable-next-line no-console
    console.log("[preview] onActionCost", actionType, "-" + cost);
    await Promise.resolve();
    setCharacter((c) => ({
      ...c,
      currentEndurance: Math.max(0, c.currentEndurance - cost),
    }));
  }, []);

  const onXpChange = useCallback(async (newXp: number) => {
    // eslint-disable-next-line no-console
    console.log("[preview] onXpChange", newXp);
    await Promise.resolve();
    setCharacter((c) => ({ ...c, xp: newXp, level: calculateLevel(newXp) }));
  }, []);

  const onTrainingChange = useCallback(async (delta: 1 | -1) => {
    // eslint-disable-next-line no-console
    console.log("[preview] onTrainingChange", delta);
    await Promise.resolve();
    setCharacter((c) => ({
      ...c,
      enduranceTrainings: Math.max(0, c.enduranceTrainings + delta),
    }));
  }, []);

  const allocated = countAllocatedPoints(character.skills);

  return (
    <main className="relative z-[2] min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-grimoire">Preview / dev</p>
            <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
              CharacterSheet
            </h1>
            <p className="mt-1 text-xs text-ink-tertiary">
              Mock Brad — <span className="tabular">{allocated}</span> pts alloués
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
            <span className="label-grimoire">Mode MJ</span>
            <button
              type="button"
              onClick={() => setIsMJ((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isMJ ? "bg-primary" : "bg-secondary"
              }`}
              aria-pressed={isMJ}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-foreground transition-transform ${
                  isMJ ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span
              className={`tabular text-xs font-semibold uppercase tracking-[0.12em] ${
                isMJ ? "text-primary" : "text-ink-tertiary"
              }`}
            >
              {isMJ ? "ON" : "OFF"}
            </span>
          </label>
        </div>

        <CharacterSheet
          character={character}
          isMJ={isMJ}
          onSkillChange={onSkillChange}
          onVitalChange={onVitalChange}
          onActionCost={onActionCost}
          onXpChange={onXpChange}
          onTrainingChange={onTrainingChange}
        />
      </div>
    </main>
  );
}
