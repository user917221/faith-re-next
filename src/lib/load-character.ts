/**
 * Charge un personnage depuis Neon et l'hydrate avec les vitals dérivés
 * (maxHp, maxMental, maxEndurance + level) pour rendu par <CharacterSheet>.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import {
  BASE_HP,
  BASE_MHP,
  calculateLevel,
  getLevelBonus,
  getEnduranceTier,
  getFluxTier,
  getTechnicalTier,
  tierLabel,
} from "@/lib/faith-system";
import { calculateAttribute } from "@/lib/skills";
import type { Character } from "@/components/character-sheet/types";

export type HydratedCharacter = Character;

export async function loadCharacter(characterId: string): Promise<HydratedCharacter | null> {
  const row = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    with: { skills: true, runesInventory: true, conditions: true },
  });
  if (!row) return null;
  return hydrate(row);
}

export async function loadAllCharacters(): Promise<HydratedCharacter[]> {
  const rows = await db.query.characters.findMany({
    with: { skills: true, runesInventory: true, conditions: true },
  });
  return rows.map(hydrate).sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadCharacterForUser(userId: string): Promise<HydratedCharacter | null> {
  const row = await db.query.characters.findFirst({
    where: eq(characters.ownerUserId, userId),
    with: { skills: true, runesInventory: true, conditions: true },
  });
  if (!row) return null;
  return hydrate(row);
}

type CharacterRow = typeof characters.$inferSelect & {
  skills: { skillName: string; points: number }[];
  runesInventory?: {
    id: string;
    name: string;
    type: "utilitaire" | "armement" | "predefinie";
    description: string | null;
  }[];
  conditions?: {
    id: string;
    label: string;
    kind: "buff" | "debuff" | "wound" | "focus" | "neutral";
  }[];
};

function hydrate(row: CharacterRow): HydratedCharacter {
  const skills = Object.fromEntries(row.skills.map((s) => [s.skillName, s.points]));
  const level = calculateLevel(row.xp);
  const bonus = getLevelBonus(level);
  const constiScore = calculateAttribute(skills, "CONSTITUTION");
  const psyScore = calculateAttribute(skills, "PSYCHÉ");
  const enduTier = getEnduranceTier(row.enduranceTrainings);
  const fluxTier = getFluxTier(row.fluxTrainings, row.combatsReal);
  const techTier = getTechnicalTier(row.technicalTrainings);

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
    avatarUrl: row.avatarUrl ?? null,
    // --- Flux ---
    fluxTrainings: row.fluxTrainings,
    technicalTrainings: row.technicalTrainings,
    combatsReal: row.combatsReal,
    currentFlux: row.currentFlux,
    maxFlux: fluxTier.max,
    fluxPalier: fluxTier.palier,
    fluxLabel: fluxTier.label,
    technicalPalier: techTier.palier,
    technicalLabel: techTier.label,
    tier: tierLabel(row.xp),
    // --- Stats de combat ---
    initiative: row.initiative,
    armor: row.armor,
    movement: row.movement,
    proficiency: row.proficiency,
    // --- Tags d'identité ---
    race: row.race ?? null,
    pronouns: row.pronouns ?? null,
    charClass: row.charClass ?? null,
    // --- Conditions actives ---
    conditions: (row.conditions ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      kind: c.kind,
    })),
    // --- Inventaire ---
    runesInventory: (row.runesInventory ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      description: r.description,
    })),
  };
}
