import { SKILL_GROUPS, calculateAttribute, type AttributeName } from "@/lib/skills";
import { SkillRow } from "./SkillRow";
import type { Character } from "./types";

type Props = {
  character: Character;
  isCapped: boolean;
  onSkillChange?: (skillName: string, delta: 1 | -1) => Promise<void>;
};

export function AttributesGrid({ character, isCapped, onSkillChange }: Props) {
  const attributes = Object.keys(SKILL_GROUPS) as AttributeName[];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {attributes.map((attr) => {
        const score = calculateAttribute(character.skills, attr);
        return (
          <div key={attr} className="card-grimoire">
            <header className="mb-3 flex items-center justify-between">
              <span className="font-display text-lg font-medium uppercase tracking-[0.15em] text-gold-aged">
                {attr}
              </span>
              <span
                title={`Score d'attribut ${attr}`}
                className="tabular flex h-9 w-9 items-center justify-center rounded-full border border-gold-aged/30 text-base font-bold text-gold-bright"
              >
                {score}
              </span>
            </header>
            <div className="flex flex-col gap-2.5">
              {SKILL_GROUPS[attr].map((skill) => (
                <SkillRow
                  key={skill}
                  name={skill}
                  value={character.skills[skill] ?? 0}
                  isCapped={isCapped}
                  onSkillChange={onSkillChange}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
