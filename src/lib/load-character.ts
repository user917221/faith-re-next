/**
 * Charge un personnage depuis Neon et l'hydrate avec les vitals dérivés
 * (maxHp, maxMental, maxEndurance + level) pour rendu par <CharacterSheet>.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { BASE_HP, BASE_MHP, calculateLevel, getLevelBonus, getEnduranceTier } from "@/lib/faith-system";
import { calculateAttribute } from "@/lib/skills";
import type { Character } from "@/components/character-sheet/types";

export type HydratedCharacter = Character;

export async function loadCharacter(characterId: string): Promise<HydratedCharacter | null> {
  const row = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    with: { skills: true },
  });
  if (!row) return null;
  return hydrate(row);
}

export async function loadAllCharacters(): Promise<HydratedCharacter[]> {
  const rows = await db.query.characters.findMany({
    with: { skills: true },
  });
  return rows.map(hydrate).sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadCharacterForUser(userId: string): Promise<HydratedCharacter | null> {
  const row = await db.query.characters.findFirst({
    where: eq(characters.ownerUserId, userId),
    with: { skills: true },
  });
  if (!row) return null;
  return hydrate(row);
}

function hydrate(row: typeof characters.$inferSelect & { skills: { skillName: string; points: number }[] }): HydratedCharacter {
  const skills = Object.fromEntries(row.skills.map((s) => [s.skillName, s.points]));
  const level = calculateLevel(row.xp);
  const bonus = getLevelBonus(level);
  const constiScore = calculateAttribute(skills, "CONSTITUTION");
  const psyScore = calculateAttribute(skills, "PSYCHÉ");
  const enduTier = getEnduranceTier(row.enduranceTrainings);

  return {
    id: row.id,
    name: row.name,
    nom: row.nom ?? "",
    age: row.age,
    xp: row.xp,
    level,
    enduranceTrainings: row.enduranceTrainings,
    currentHp: row.currentHp,
    currentMental: row.currentMental,
    currentEndurance: row.currentEndurance,
    maxHp: BASE_HP + bonus + constiScore,
    maxMental: BASE_MHP + bonus + psyScore,
    maxEndurance: enduTier.max,
    fatePoints: row.fatePoints,
    runes: Array.isArray(row.runes) ? (row.runes as string[]) : ["", "", ""],
    skills,
    isPresent: row.isPresent === 1,
  };
}
