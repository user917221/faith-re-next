"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters, publicRolls } from "@/db/schema";
import { revalidatePath } from "next/cache";
import {
  BASE_HP,
  BASE_MHP,
  getLevelBonus,
  calculateLevel,
  getEnduranceTier,
} from "@/lib/faith-system";
import { calculateAttribute } from "@/lib/skills";
import { assertCanEdit } from "./guards";

/** Roll utility — 1dN, retourne le résultat. */
function rollDie(faces: number): number {
  return Math.floor(Math.random() * faces) + 1;
}

/**
 * Récupération HP — formule `(2d6 + Écaillé) / 2` arrondi inférieur.
 * Écaillé est un skill de CONSTITUTION (régénération naturelle du corps).
 * Le gain est ajouté au currentHp, cappé au maxHp dérivé.
 */
export async function recoverHp(characterId: string): Promise<
  | {
      ok: true;
      gain: number;
      d1: number;
      d2: number;
      ecaille: number;
      newHp: number;
      maxHp: number;
    }
  | { ok: false; reason: string }
> {
  const { session } = await assertCanEdit(characterId);

  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    with: { skills: true },
  });
  if (!char) return { ok: false, reason: "Personnage introuvable" };

  const skillsMap = Object.fromEntries(
    char.skills.map((s) => [s.skillName, s.points]),
  );
  const ecaille = skillsMap["Écaillé"] ?? 0;
  const d1 = rollDie(6);
  const d2 = rollDie(6);
  const raw = d1 + d2 + ecaille;
  const gain = Math.max(0, Math.floor(raw / 2));

  // Max HP dérivé : BASE_HP + bonus_level + score CONSTITUTION (somme des 5 skills)
  const level = calculateLevel(char.xp);
  const bonus = getLevelBonus(level);
  const constiScore = calculateAttribute(skillsMap, "CONSTITUTION");
  const maxHp = BASE_HP + bonus + constiScore;

  const newHp = Math.min(maxHp, char.currentHp + gain);

  // Neon HTTP ne supporte pas les transactions interactives. On séquence :
  // l'update PV est l'op critique, le log plateau suit (best-effort).
  await db
    .update(characters)
    .set({ currentHp: newHp, updatedAt: new Date() })
    .where(eq(characters.id, char.id));

  // Log dans le feed plateau pour que la table voie la régen
  await db.insert(publicRolls).values({
    characterId: char.id,
    characterName: char.name,
    casterUserId: session.user.id,
    casterName: session.user.name ?? "—",
    formula: "Récup HP — (2d6 + Écaillé) / 2",
    rolls: [d1, d2],
    attrName: "CONSTITUTION",
    attrScore: null,
    skillName: "Écaillé",
    skillScore: ecaille,
    total: gain,
    isCritSucc: d1 === 6 && d2 === 6 ? 1 : 0,
    isCritFail: d1 === 1 && d2 === 1 ? 1 : 0,
  });

  revalidatePath("/me");
  revalidatePath("/mj");
  revalidatePath("/plateau");

  return { ok: true, gain, d1, d2, ecaille, newHp, maxHp };
}

/**
 * Récupération Endurance — formule `1d50 / 2` arrondi inférieur.
 * Le gain est ajouté à l'endurance courante, cappé au max dérivé du palier
 * d'entraînements.
 */
export async function recoverEndurance(characterId: string): Promise<
  | {
      ok: true;
      gain: number;
      roll: number;
      newEndurance: number;
      maxEndurance: number;
    }
  | { ok: false; reason: string }
> {
  const { session } = await assertCanEdit(characterId);

  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  });
  if (!char) return { ok: false, reason: "Personnage introuvable" };

  const roll = rollDie(50);
  const gain = Math.max(0, Math.floor(roll / 2));

  const tier = getEnduranceTier(char.enduranceTrainings);
  const maxEndurance = tier.max;
  const newEndurance = Math.min(maxEndurance, char.currentEndurance + gain);

  // Neon HTTP ne supporte pas les transactions interactives → séquentiel.
  await db
    .update(characters)
    .set({ currentEndurance: newEndurance, updatedAt: new Date() })
    .where(eq(characters.id, char.id));

  await db.insert(publicRolls).values({
    characterId: char.id,
    characterName: char.name,
    casterUserId: session.user.id,
    casterName: session.user.name ?? "—",
    formula: "Récup Endurance — 1d50 / 2",
    rolls: [roll],
    attrName: null,
    attrScore: null,
    skillName: null,
    skillScore: null,
    total: gain,
    isCritSucc: 0,
    isCritFail: 0,
  });

  revalidatePath("/me");
  revalidatePath("/mj");
  revalidatePath("/plateau");

  return { ok: true, gain, roll, newEndurance, maxEndurance };
}

// Récupération MHP (Mental) — formule miroir HP pour cohérence narrative
// (2d6 + Sang-Froid) / 2. Pas demandé par le user mais préparé en
// commentaire pour réutilisation future si besoin.
// Marqué `void` pour suppression linter ; à activer si tu veux.
void BASE_MHP;
