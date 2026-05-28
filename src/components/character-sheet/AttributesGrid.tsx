"use client";

import { SKILL_GROUPS, calculateAttribute, type AttributeName } from "@/lib/skills";
import { SkillRow } from "./SkillRow";
import { DDPopover } from "./DDPopover";
import type { Character } from "./types";

type Props = {
  character: Character;
  isCapped: boolean;
  onSkillChange?: (skillName: string, delta: 1 | -1) => Promise<void>;
  onRollSkill?: (input: {
    attrName: AttributeName;
    skillName?: string | null;
    dd: number | null;
  }) => Promise<void>;
};

export function AttributesGrid({ character, isCapped, onSkillChange, onRollSkill }: Props) {
  const attributes = Object.keys(SKILL_GROUPS) as AttributeName[];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {attributes.map((attr) => {
        const score = calculateAttribute(character.skills, attr);
        return (
          <div key={attr} className="card-grimoire card-hover-lift">
            <header className="mb-3 flex items-center justify-between">
              <span className="font-display text-lg font-medium uppercase tracking-[0.15em] text-gold-aged">
                {attr}
              </span>
              {onRollSkill ? (
                <DDPopover
                  title={attr}
                  bonus={score}
                  bonusLabel={attr}
                  onRoll={async (dd) => onRollSkill({ attrName: attr, skillName: null, dd })}
                  trigger={
                    <button
                      type="button"
                      title={`Lancer un jet d'attribut ${attr}`}
                      aria-label={`Lancer un jet d'attribut ${attr}`}
                      className="focus-grimoire tabular flex h-9 w-9 items-center justify-center rounded-full border border-gold-aged/30 text-base font-bold text-gold-bright transition-colors hover:border-gold-aged/60 hover:bg-gold-aged/10"
                    >
                      {score}
                    </button>
                  }
                />
              ) : (
                <span
                  title={`Score d'attribut ${attr}`}
                  className="tabular flex h-9 w-9 items-center justify-center rounded-full border border-gold-aged/30 text-base font-bold text-gold-bright"
                >
                  {score}
                </span>
              )}
            </header>
            <div className="flex flex-col gap-2.5">
              {SKILL_GROUPS[attr].map((skill) => (
                <SkillRow
                  key={skill}
                  name={skill}
                  value={character.skills[skill] ?? 0}
                  attrScore={score}
                  isCapped={isCapped}
                  onSkillChange={onSkillChange}
                  onRollSkill={onRollSkill}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
