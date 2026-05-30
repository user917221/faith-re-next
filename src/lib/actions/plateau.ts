/**
 * Server Actions — table de jeu publique (/plateau).
 *
 * - `rollPublicSkill` : 2d6 + attribut (+ skill optionnel), persiste dans
 *   `public_roll`, visible par tout user connecté.
 * - `rollPublicFormula` : XdY (+ modificateur numérique ou shorthand attribut),
 *   persiste aussi.
 * - `listRecentPublicRolls` : les 30 derniers jets, plus récent en premier.
 *
 * Pas de check de rôle : tout user connecté (joueur, MJ, spectateur) peut
 * lancer un jet sur n'importe quel perso de la table. Le snapshot du nom du
 * perso + du caster est stocké pour résilience si le user/perso est supprimé.
 */

"use server";

import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { publicRolls, characters } from "@/db/schema";
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

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
}

async function loadCharacterWithSkills(characterId: string) {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    with: { skills: true },
  });
  if (!char) throw new Error("NOT_FOUND");
  const skillsMap: Record<string, number> = {};
  for (const s of char.skills) skillsMap[s.skillName] = s.points;
  return { char, skillsMap };
}

// ---------------- rollPublicSkill ----------------

export async function rollPublicSkill(input: {
  characterId: string;
  attrName: AttributeName;
  skillName?: string | null;
}): Promise<
  | {
      ok: true;
      rollId: string;
      total: number;
      isCritSucc: boolean;
      isCritFail: boolean;
    }
  | { ok: false; reason: string }
> {
  const session = await requireSession();

  if (!SKILL_GROUPS[input.attrName]) {
    return { ok: false, reason: `Attribut inconnu : ${input.attrName}` };
  }

  let char;
  let skillsMap;
  try {
    const r = await loadCharacterWithSkills(input.characterId);
    char = r.char;
    skillsMap = r.skillsMap;
  } catch {
    return { ok: false, reason: "Personnage introuvable" };
  }

  // Si un skill est passé, vérifier qu'il appartient à l'attribut.
  let resolvedSkill: string | null = null;
  let skillScore = 0;
  if (input.skillName) {
    const belongs = (SKILL_GROUPS[input.attrName] as readonly string[]).includes(
      input.skillName,
    );
    if (!belongs) {
      return {
        ok: false,
        reason: `Skill ${input.skillName} hors de ${input.attrName}`,
      };
    }
    resolvedSkill = input.skillName;
    skillScore = skillsMap[input.skillName] ?? 0;
  }

  const d1 = rollD6();
  const d2 = rollD6();
  const diceSum = d1 + d2;
  const attrScore = calculateAttribute(skillsMap, input.attrName);
  const total = diceSum + attrScore + skillScore;
  const isCritSucc = d1 === 6 && d2 === 6;
  const isCritFail = d1 === 1 && d2 === 1;

  const formula = resolvedSkill
    ? `2d6 + ${input.attrName} + ${resolvedSkill}`
    : `2d6 + ${input.attrName}`;

  const [inserted] = await db
    .insert(publicRolls)
    .values({
      characterId: char.id,
      characterName: char.name,
      casterUserId: session.user.id,
      casterName: session.user.name ?? "Inconnu",
      formula,
      rolls: [d1, d2],
      attrName: input.attrName,
      attrScore,
      skillName: resolvedSkill,
      skillScore: resolvedSkill ? skillScore : null,
      total,
      isCritSucc: isCritSucc ? 1 : 0,
      isCritFail: isCritFail ? 1 : 0,
    })
    .returning({ id: publicRolls.id });

  revalidatePath("/plateau");

  return { ok: true, rollId: inserted.id, total, isCritSucc, isCritFail };
}

// ---------------- rollPublicFormula ----------------

const FORMULA_RE = /^(\d+)d(\d+)(?:([+-])(\d+|int|psy|con|man|mnv))?$/i;

export async function rollPublicFormula(input: {
  characterId: string;
  formula: string;
}): Promise<
  { ok: true; rollId: string; total: number } | { ok: false; reason: string }
> {
  const session = await requireSession();

  const trimmed = (input.formula ?? "").trim();
  if (!trimmed) return { ok: false, reason: "Formule vide" };

  const match = trimmed.match(FORMULA_RE);
  if (!match) {
    return { ok: false, reason: "Syntaxe invalide. Ex : 2d6+5, 2d6+INT" };
  }

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const sign = match[3] as "+" | "-" | undefined;
  const modRaw = match[4];

  if (count < 1 || count > 50) {
    return { ok: false, reason: "Nombre de dés invalide (1-50)" };
  }
  if (sides < 2 || sides > 1000) {
    return { ok: false, reason: "Taille de dé invalide (2-1000)" };
  }

  let char;
  let skillsMap;
  try {
    const r = await loadCharacterWithSkills(input.characterId);
    char = r.char;
    skillsMap = r.skillsMap;
  } catch {
    return { ok: false, reason: "Personnage introuvable" };
  }

  const rolls: number[] = [];
  for (let i = 0; i < count; i++) rolls.push(rollDie(sides));
  const diceSum = rolls.reduce((acc, r) => acc + r, 0);

  let modValue = 0;
  let resolvedAttr: AttributeName | null = null;
  let modLabel = "";
  let formulaCanonical = `${count}d${sides}`;

  if (sign && modRaw !== undefined) {
    const signMul = sign === "+" ? 1 : -1;
    if (/^\d+$/.test(modRaw)) {
      modValue = parseInt(modRaw, 10) * signMul;
      modLabel = `${sign}${Math.abs(modValue)}`;
      formulaCanonical = `${count}d${sides}${sign}${Math.abs(modValue)}`;
    } else {
      const short = modRaw.toUpperCase();
      const attrName = ATTR_SHORTHAND[short];
      if (!attrName) {
        return { ok: false, reason: `Modificateur inconnu : ${short}` };
      }
      resolvedAttr = attrName;
      modValue = calculateAttribute(skillsMap, attrName) * signMul;
      modLabel = `${sign}${short}`;
      formulaCanonical = `${count}d${sides}${sign}${short}`;
    }
  }

  const total = diceSum + modValue;

  // Crits 2d6 standards uniquement (par défaut, lit double-6/double-1).
  const isCritSucc = count === 2 && sides === 6 && rolls[0] === 6 && rolls[1] === 6;
  const isCritFail = count === 2 && sides === 6 && rolls[0] === 1 && rolls[1] === 1;

  const [inserted] = await db
    .insert(publicRolls)
    .values({
      characterId: char.id,
      characterName: char.name,
      casterUserId: session.user.id,
      casterName: session.user.name ?? "Inconnu",
      formula: formulaCanonical,
      rolls,
      attrName: resolvedAttr,
      attrScore: resolvedAttr ? Math.abs(modValue) : null,
      skillName: null,
      skillScore: null,
      total,
      isCritSucc: isCritSucc ? 1 : 0,
      isCritFail: isCritFail ? 1 : 0,
    })
    .returning({ id: publicRolls.id });

  revalidatePath("/plateau");

  // modLabel n'est pas persisté ; il sert juste à la prochaine étape si on en a besoin.
  void modLabel;

  return { ok: true, rollId: inserted.id, total };
}

// ---------------- rollPublicPool ----------------

/**
 * Jet « pool » générique du cockpit (Jet Rapide) : une ou plusieurs séries de
 * dés `NdS`, un modificateur plat, et un mode de conservation :
 *  - "all"      : somme de tous les dés (+ mod) — jet simple ou pool.
 *  - "highest"  : garde le meilleur dé (+ mod) — avantage.
 *  - "lowest"   : garde le pire dé (+ mod) — désavantage.
 * Persiste un seul `public_roll` (visible sur /plateau).
 */
export async function rollPublicPool(input: {
  characterId: string;
  dice: { sides: number; count: number }[];
  modifier?: number;
  keep?: "all" | "highest" | "lowest";
}): Promise<
  | {
      ok: true;
      rollId: string;
      total: number;
      rolls: number[];
      isCritSucc: boolean;
      isCritFail: boolean;
    }
  | { ok: false; reason: string }
> {
  const session = await requireSession();

  const keep = input.keep ?? "all";
  const modifier = Number.isFinite(input.modifier)
    ? Math.max(-99, Math.min(99, Math.trunc(input.modifier as number)))
    : 0;

  const groups = (input.dice ?? []).filter((g) => g && g.count > 0);
  if (groups.length === 0) return { ok: false, reason: "Aucun dé" };

  // Aplatit en une liste de faces (une entrée par dé lancé) pour valider + roller.
  const flatSides: number[] = [];
  for (const g of groups) {
    const sides = Math.trunc(g.sides);
    const count = Math.trunc(g.count);
    if (sides < 2 || sides > 1000) {
      return { ok: false, reason: "Taille de dé invalide (2-1000)" };
    }
    if (count < 1 || count > 50) {
      return { ok: false, reason: "Nombre de dés invalide (1-50)" };
    }
    for (let i = 0; i < count; i++) flatSides.push(sides);
  }
  if (flatSides.length > 50) {
    return { ok: false, reason: "Pool trop grand (50 dés max)" };
  }
  if ((keep === "highest" || keep === "lowest") && flatSides.length < 2) {
    return { ok: false, reason: "Avantage : il faut au moins 2 dés" };
  }

  let char;
  try {
    char = (await loadCharacterWithSkills(input.characterId)).char;
  } catch {
    return { ok: false, reason: "Personnage introuvable" };
  }

  const rolls = flatSides.map((s) => rollDie(s));

  // Détermine la valeur conservée + l'index décisif (pour les crits naturels).
  let kept: number;
  let keptIdx: number;
  if (keep === "highest") {
    keptIdx = rolls.reduce((best, r, i) => (r > rolls[best] ? i : best), 0);
    kept = rolls[keptIdx];
  } else if (keep === "lowest") {
    keptIdx = rolls.reduce((worst, r, i) => (r < rolls[worst] ? i : worst), 0);
    kept = rolls[keptIdx];
  } else {
    keptIdx = -1;
    kept = rolls.reduce((acc, r) => acc + r, 0);
  }

  const total = kept + modifier;

  // Crits naturels : sur un dé unique décisif (avantage/désavantage ou 1 seul dé)
  // → face max / face 1. Sur une somme de pool, on les laisse à false.
  let isCritSucc = false;
  let isCritFail = false;
  if (keep === "highest" || keep === "lowest") {
    isCritSucc = kept === flatSides[keptIdx];
    isCritFail = kept === 1;
  } else if (flatSides.length === 1) {
    isCritSucc = rolls[0] === flatSides[0];
    isCritFail = rolls[0] === 1;
  }

  // Formule canonique lisible : "2d6 + 1d8 (av.) +3"
  const dicePart = groups
    .map((g) => `${Math.trunc(g.count)}d${Math.trunc(g.sides)}`)
    .join(" + ");
  const keepSuffix =
    keep === "highest" ? " (av.)" : keep === "lowest" ? " (dés.)" : "";
  const modPart =
    modifier !== 0 ? ` ${modifier > 0 ? "+" : "−"}${Math.abs(modifier)}` : "";
  const formula = `${dicePart}${keepSuffix}${modPart}`;

  const [inserted] = await db
    .insert(publicRolls)
    .values({
      characterId: char.id,
      characterName: char.name,
      casterUserId: session.user.id,
      casterName: session.user.name ?? "Inconnu",
      formula,
      rolls,
      attrName: null,
      attrScore: null,
      skillName: null,
      skillScore: null,
      total,
      isCritSucc: isCritSucc ? 1 : 0,
      isCritFail: isCritFail ? 1 : 0,
    })
    .returning({ id: publicRolls.id });

  revalidatePath("/plateau");

  return { ok: true, rollId: inserted.id, total, rolls, isCritSucc, isCritFail };
}

// ---------------- listRecentPublicRolls ----------------

export async function listRecentPublicRolls(): Promise<
  Array<{
    id: string;
    characterName: string;
    casterName: string;
    formula: string;
    rolls: number[];
    attrName: string | null;
    attrScore: number | null;
    skillName: string | null;
    skillScore: number | null;
    total: number;
    dd: number | null;
    success: boolean | null;
    isCritSucc: boolean;
    isCritFail: boolean;
    createdAt: Date;
  }>
> {
  const rows = await db
    .select()
    .from(publicRolls)
    .orderBy(desc(publicRolls.createdAt))
    .limit(30);

  return rows.map((r) => ({
    id: r.id,
    characterName: r.characterName,
    casterName: r.casterName,
    formula: r.formula,
    rolls: r.rolls,
    attrName: r.attrName,
    attrScore: r.attrScore,
    skillName: r.skillName,
    skillScore: r.skillScore,
    total: r.total,
    dd: r.dd,
    success: r.success === null ? null : r.success === 1,
    isCritSucc: r.isCritSucc === 1,
    isCritFail: r.isCritFail === 1,
    createdAt: r.createdAt,
  }));
}
