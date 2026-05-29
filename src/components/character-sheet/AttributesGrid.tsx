"use client";

import { SKILL_GROUPS, calculateAttribute, type AttributeName } from "@/lib/skills";
import { SkillRow } from "./SkillRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <Card key={attr} size="sm" className="border border-border ring-0">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-tight text-foreground">
                {attr}
              </CardTitle>
              {openAttrRoll ? (
                <button
                  type="button"
                  onClick={openAttrRoll}
                  title={`Lancer un jet d'attribut ${attr}`}
                  aria-label={`Lancer un jet d'attribut ${attr}`}
                  className="tabular rounded-md px-1 text-3xl font-semibold leading-none text-foreground outline-none transition-colors hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {score}
                </button>
              ) : (
                <span
                  title={`Score d'attribut ${attr}`}
                  className="tabular px-1 text-3xl font-semibold leading-none text-foreground"
                >
                  {score}
                </span>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-0.5">
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
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
