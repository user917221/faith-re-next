"use client";

import { SKILL_GROUPS, calculateAttribute, type AttributeName } from "@/lib/skills";
import { SkillRow } from "./SkillRow";
import type { RollContext } from "./DDDrawer";
import type { Character } from "./types";

type Props = {
  character: Character;
  isCapped: boolean;
  onSkillChange?: (skillName: string, delta: 1 | -1) => Promise<void>;
  onOpenRollDrawer?: (ctx: RollContext & { attrName: AttributeName; skillName: string | null }) => void;
};

export function AttributesGrid({ character, isCapped, onSkillChange, onOpenRollDrawer }: Props) {
  const attributes = Object.keys(SKILL_GROUPS) as AttributeName[];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {attributes.map((attr) => {
        const score = calculateAttribute(character.skills, attr);
        const openAttrRoll = onOpenRollDrawer
          ? () =>
              onOpenRollDrawer({
                title: attr,
                bonus: score,
                bonusLabel: `${attr} (${score}) seul`,
                attrName: attr,
                skillName: null,
              })
          : null;

        return (
          <div key={attr} className="card-grimoire card-hover-lift">
            <header className="mb-4 flex items-center justify-between border-b border-gold-aged/10 pb-3">
              <span className="font-display text-lg font-black uppercase tracking-[0.12em] text-gold-aged">
                {attr}
              </span>
              {openAttrRoll ? (
                <button
                  type="button"
                  onClick={openAttrRoll}
                  title={`Lancer un jet d'attribut ${attr}`}
                  aria-label={`Lancer un jet d'attribut ${attr}`}
                  className="focus-grimoire tabular flex h-9 w-9 items-center justify-center rounded-full border border-gold-aged/30 text-base font-bold text-gold-bright transition-all hover:-translate-y-px hover:border-gold-aged/60 hover:bg-gold-aged/10"
                >
                  {score}
                </button>
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
                  onOpenRollDrawer={onOpenRollDrawer}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
