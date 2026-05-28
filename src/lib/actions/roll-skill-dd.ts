"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters, publicRolls } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  SKILL_GROUPS,
  calculateAttribute,
  type AttributeName,
} from "@/lib/skills";

/**
 * Lance 2d6 + attribut (+ skill optionnel) contre une difficulté.
 * Persiste dans le feed plateau avec dd + success flag.
 *
 * Si dd est null → jet libre, success=null (informatif uniquement).
 * Sinon : success = total >= dd. Crit naturel d'abord (double 6 succ, double 1 fail)
 * sur le total, indépendamment du DD.
 */
export async function rollSkillWithDD(input: {
  characterId: string;
  attrName: AttributeName;
  skillName?: string | null;
  dd: number | null;
}): Promise<
  | {
      ok: true;
      rollId: string;
      d1: number;
      d2: number;
      attrScore: number;
      skillScore: number;
      total: number;
      success: boolean | null;
      isCritSucc: boolean;
      isCritFail: boolean;
    }
  | { ok: false; reason: string }
> {
  const session = await auth();
  if (!session?.user) return { ok: false, reason: "UNAUTHORIZED" };

  const char = await db.query.characters.findFirst({
    where: eq(characters.id, input.characterId),
    with: { skills: true },
  });
  if (!char) return { ok: false, reason: "Personnage introuvable" };
  if (!(input.attrName in SKILL_GROUPS)) {
    return { ok: false, reason: `Attribut inconnu : ${input.attrName}` };
  }

  const skillsMap = Object.fromEntries(
    char.skills.map((s) => [s.skillName, s.points]),
  );
  const attrScore = calculateAttribute(skillsMap, input.attrName);

  let skillScore = 0;
  let resolvedSkill: string | null = null;
  if (input.skillName) {
    const skillsInAttr = SKILL_GROUPS[input.attrName] as readonly string[];
    if (!skillsInAttr.includes(input.skillName)) {
      return {
        ok: false,
        reason: `${input.skillName} n'est pas une compétence de ${input.attrName}`,
      };
    }
    resolvedSkill = input.skillName;
    skillScore = skillsMap[input.skillName] ?? 0;
  }

  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const total = d1 + d2 + attrScore + skillScore;
  const isCritSucc = d1 === 6 && d2 === 6;
  const isCritFail = d1 === 1 && d2 === 1;

  let success: boolean | null = null;
  if (typeof input.dd === "number") {
    success = total >= input.dd;
    // Crit force le résultat même si le DD le contredit (règles JDR classiques)
    if (isCritSucc) success = true;
    if (isCritFail) success = false;
  }

  const [created] = await db
    .insert(publicRolls)
    .values({
      characterId: char.id,
      characterName: char.name,
      casterUserId: session.user.id,
      casterName: session.user.name ?? "—",
      formula: resolvedSkill
        ? `2d6 + ${input.attrName} + ${resolvedSkill}`
        : `2d6 + ${input.attrName}`,
      rolls: [d1, d2],
      attrName: input.attrName,
      attrScore,
      skillName: resolvedSkill,
      skillScore,
      total,
      dd: input.dd,
      success: success === null ? null : success ? 1 : 0,
      isCritSucc: isCritSucc ? 1 : 0,
      isCritFail: isCritFail ? 1 : 0,
    })
    .returning({ id: publicRolls.id });

  revalidatePath("/plateau");

  return {
    ok: true,
    rollId: created.id,
    d1,
    d2,
    attrScore,
    skillScore,
    total,
    success,
    isCritSucc,
    isCritFail,
  };
}
