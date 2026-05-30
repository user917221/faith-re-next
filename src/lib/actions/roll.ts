/**
 * Server Actions — moteur de jets de dés FAITH : RE.
 *
 * - `rollSkillCheck` : 2d6 + attribut + skill (optionnel). Détecte les crits
 *   sur double-6 / double-1.
 * - `rollCustomFormula` : XdY (+ modificateur numérique OU shorthand attribut).
 *   Regex stricte ; renvoie `{ error }` si la syntaxe est invalide.
 *
 * Pas d'écriture en BDD : ces actions ne mutent pas. On exige simplement
 * d'être loggé et que le perso existe (n'importe quel user loggé peut lire,
 * y compris spectateurs).
 */

"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  ATTR_SHORTHAND,
  SKILL_GROUPS,
  calculateAttribute,
  type AttributeName,
} from "@/lib/skills";

function rollD6(): number {
  return 1 + Math.floor(Math.random() * 6);
}

function rollDie(sides: number): number {
  return 1 + Math.floor(Math.random() * sides);
}

async function loadSkillsMap(characterId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    with: { skills: true },
  });
  if (!char) throw new Error("NOT_FOUND");

  const skillsMap: Record<string, number> = {};
  for (const s of char.skills) skillsMap[s.skillName] = s.points;
  return { char, skillsMap };
}

// ---------------- rollSkillCheck ----------------

export async function rollSkillCheck(
  characterId: string,
  attrName: AttributeName,
  skillName?: string | null,
): Promise<{
  rolls: [number, number];
  diceSum: number;
  attrName: AttributeName;
  attrScore: number;
  skillName: string | null;
  skillScore: number;
  total: number;
  isCritSucc: boolean;
  isCritFail: boolean;
}> {
  if (!SKILL_GROUPS[attrName]) {
    throw new Error(`UNKNOWN_ATTRIBUTE:${attrName}`);
  }

  const { skillsMap } = await loadSkillsMap(characterId);

  const d1 = rollD6();
  const d2 = rollD6();
  const diceSum = d1 + d2;

  const attrScore = calculateAttribute(skillsMap, attrName);

  // Si un skill est passé, on vérifie qu'il appartient bien à l'attribut.
  let resolvedSkill: string | null = null;
  let skillScore = 0;
  if (skillName) {
    const belongs = (SKILL_GROUPS[attrName] as readonly string[]).includes(
      skillName,
    );
    if (!belongs) {
      throw new Error(`SKILL_NOT_IN_ATTRIBUTE:${skillName}`);
    }
    resolvedSkill = skillName;
    skillScore = skillsMap[skillName] ?? 0;
  }

  return {
    rolls: [d1, d2],
    diceSum,
    attrName,
    attrScore,
    skillName: resolvedSkill,
    skillScore,
    // Jet de compétence = 2d6 + compétence ; attribut seul = 2d6 + attribut.
    total: diceSum + (resolvedSkill ? skillScore : attrScore),
    isCritSucc: d1 === 6 && d2 === 6,
    isCritFail: d1 === 1 && d2 === 1,
  };
}

// ---------------- rollCustomFormula ----------------

const FORMULA_RE = /^(\d+)d(\d+)(?:([+-])(\d+|int|psy|con|man|mnv))?$/i;

export async function rollCustomFormula(
  characterId: string,
  formula: string,
): Promise<
  | {
      formula: string;
      rolls: number[];
      diceSum: number;
      modifier: {
        kind: "number" | "attr";
        value: number;
        label: string;
      } | null;
      total: number;
    }
  | { error: string }
> {
  const trimmed = (formula ?? "").trim();
  if (!trimmed) return { error: "Formule vide" };

  const match = trimmed.match(FORMULA_RE);
  if (!match) {
    return { error: "Syntaxe invalide. Ex : 2d6+5, 2d6+INT" };
  }

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const sign = match[3] as "+" | "-" | undefined;
  const modRaw = match[4];

  // Garde-fous : on évite les abus type 1000d1000.
  if (count < 1 || count > 50) {
    return { error: "Nombre de dés invalide (1-50)" };
  }
  if (sides < 2 || sides > 1000) {
    return { error: "Taille de dé invalide (2-1000)" };
  }

  const rolls: number[] = [];
  for (let i = 0; i < count; i++) rolls.push(rollDie(sides));
  const diceSum = rolls.reduce((acc, r) => acc + r, 0);

  let modifier:
    | { kind: "number" | "attr"; value: number; label: string }
    | null = null;

  if (sign && modRaw !== undefined) {
    const signMul = sign === "+" ? 1 : -1;
    if (/^\d+$/.test(modRaw)) {
      const num = parseInt(modRaw, 10) * signMul;
      modifier = {
        kind: "number",
        value: num,
        label: `${sign}${Math.abs(num)}`,
      };
    } else {
      const short = modRaw.toUpperCase();
      const attrName = ATTR_SHORTHAND[short];
      if (!attrName) {
        return { error: `Modificateur inconnu : ${short}` };
      }
      // Auth + load skills pour calculer la valeur de l'attribut.
      const { skillsMap } = await loadSkillsMap(characterId);
      const attrValue = calculateAttribute(skillsMap, attrName) * signMul;
      modifier = {
        kind: "attr",
        value: attrValue,
        label: `${sign}${short} (${attrValue >= 0 ? "+" : ""}${attrValue})`,
      };
    }
  } else {
    // Pas de modificateur — on s'assure quand même que le perso existe + auth.
    await loadSkillsMap(characterId);
  }

  const total = diceSum + (modifier?.value ?? 0);

  return {
    formula: trimmed,
    rolls,
    diceSum,
    modifier,
    total,
  };
}
