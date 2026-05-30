/**
 * Server Actions — stats de combat, conditions actives et tags d'identité
 * (cockpit MJ, Phase 2).
 *
 * - `updateCombatStats` : initiative / armor / movement / proficiency (MJ ou owner).
 * - `addCondition` / `removeCondition` : conditions actives (chips colorés).
 * - `updateIdentity` : race / pronouns / classe (tags d'identité).
 *
 * Mêmes conventions que `character.ts` : auth via `assertCanEdit`, clamp métier,
 * `revalidatePath` sur /me et /mj.
 */

"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { characters, conditions, type ConditionKind } from "@/db/schema";
import { assertCanEdit } from "./guards";
import { auth } from "@/lib/auth";

// Note : l'édition des tags d'identité (race / pronoms / classe) passe par
// `updateProfile` (section « Profil — identité »), pas par ce module combat.

type ActionResult<T> = ({ ok: true } & T) | { ok: false; reason: string };

const CONDITION_KINDS: ConditionKind[] = [
  "buff",
  "debuff",
  "wound",
  "focus",
  "neutral",
];

// Bornes douces — gardent les stats dans une plage de jeu lisible.
const STAT_BOUNDS = {
  initiative: { min: -20, max: 40 },
  armor: { min: 0, max: 40 },
  movement: { min: 0, max: 40 },
  proficiency: { min: 0, max: 12 },
} as const;

function revalidateAll() {
  revalidatePath("/me");
  revalidatePath("/mj");
}

function clampStat(key: keyof typeof STAT_BOUNDS, value: number): number {
  const { min, max } = STAT_BOUNDS[key];
  return Math.max(min, Math.min(max, Math.round(value)));
}

// ---------------- updateCombatStats ----------------

export type CombatStatsPatch = Partial<{
  initiative: number;
  armor: number;
  movement: number;
  proficiency: number;
}>;

export async function updateCombatStats(
  characterId: string,
  patch: CombatStatsPatch,
): Promise<ActionResult<{ stats: Required<CombatStatsPatch> }>> {
  const { character } = await assertCanEdit(characterId);

  const next = {
    initiative: clampStat(
      "initiative",
      patch.initiative ?? character.initiative,
    ),
    armor: clampStat("armor", patch.armor ?? character.armor),
    movement: clampStat("movement", patch.movement ?? character.movement),
    proficiency: clampStat(
      "proficiency",
      patch.proficiency ?? character.proficiency,
    ),
  };

  await db
    .update(characters)
    .set({ ...next, updatedAt: new Date() })
    .where(eq(characters.id, characterId));

  revalidateAll();
  return { ok: true, stats: next };
}

// ---------------- addCondition ----------------

export async function addCondition(
  characterId: string,
  input: { label: string; kind?: ConditionKind; diceModifier?: number },
): Promise<
  ActionResult<{
    id: string;
    label: string;
    kind: ConditionKind;
    diceModifier: number;
  }>
> {
  await assertCanEdit(characterId);

  const label = input.label.trim();
  if (!label) return { ok: false, reason: "Label de condition vide" };
  if (label.length > 40) {
    return { ok: false, reason: "Label trop long (40 max)" };
  }
  const kind: ConditionKind =
    input.kind && CONDITION_KINDS.includes(input.kind) ? input.kind : "neutral";
  // Modificateur de dé signé, borné [-20, +20] pour rester jouable.
  const diceModifier = Number.isFinite(input.diceModifier)
    ? Math.max(-20, Math.min(20, Math.trunc(input.diceModifier as number)))
    : 0;

  const [row] = await db
    .insert(conditions)
    .values({ characterId, label, kind, diceModifier })
    .returning({ id: conditions.id, diceModifier: conditions.diceModifier });

  await db
    .update(characters)
    .set({ updatedAt: new Date() })
    .where(eq(characters.id, characterId));

  revalidateAll();
  return { ok: true, id: row.id, label, kind, diceModifier: row.diceModifier };
}

// ---------------- removeCondition ----------------

export async function removeCondition(
  conditionId: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const cond = await db.query.conditions.findFirst({
    where: eq(conditions.id, conditionId),
  });
  if (!cond) return { ok: false, reason: "Condition introuvable" };

  // Réutilise la garde standard (MJ ou owner du perso visé).
  await assertCanEdit(cond.characterId);

  await db.delete(conditions).where(eq(conditions.id, conditionId));
  await db
    .update(characters)
    .set({ updatedAt: new Date() })
    .where(eq(characters.id, cond.characterId));

  revalidateAll();
  return { ok: true, id: conditionId };
}
