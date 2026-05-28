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
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {attributes.map((attr) => {
        const score = calculateAttribute(character.skills, attr);
        return (
          <div
            key={attr}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
          >
            <header className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-4 py-3">
              <span className="text-sm font-bold uppercase tracking-wider text-white">
                {attr}
              </span>
              <span
                title={`Score d'attribut ${attr}`}
                className="rounded border border-cyan-400/30 bg-cyan-400/[0.08] px-2 py-0.5 text-sm font-extrabold text-cyan-300 shadow-[0_0_5px_rgba(6,187,224,0.15)]"
              >
                {score}
              </span>
            </header>
            <div className="flex flex-col gap-2.5 px-4 py-3">
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
