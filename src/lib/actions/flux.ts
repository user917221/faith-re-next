"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { getFluxTier, getTechnicalTier } from "@/lib/faith-system";
import { assertCanEdit, assertMJOnly } from "./guards";

function revalidateAll() {
  revalidatePath("/me");
  revalidatePath("/mj");
  revalidatePath("/plateau");
}

type Ok<T> = ({ ok: true } & T) | { ok: false; reason: string };

/**
 * Entraînement de Flux (MJ). Combiné aux combats réels, fait monter le
 * palier de Flux. Retourne le changement de palier pour feedback/level-up.
 */
export async function updateFluxTrainings(
  characterId: string,
  delta: 1 | -1,
): Promise<Ok<{ fluxTrainings: number; palier: number; palierLabel: string; max: number; palierChanged: boolean }>> {
  const { character } = await assertMJOnly(characterId);
  const next = Math.max(0, character.fluxTrainings + delta);
  const before = getFluxTier(character.fluxTrainings, character.combatsReal);
  const after = getFluxTier(next, character.combatsReal);

  await db
    .update(characters)
    .set({ fluxTrainings: next, updatedAt: new Date() })
    .where(eq(characters.id, characterId));
  revalidateAll();

  return {
    ok: true,
    fluxTrainings: next,
    palier: after.palier,
    palierLabel: after.label,
    max: after.max,
    palierChanged: after.palier !== before.palier,
  };
}

/** Combats réels (MJ). Condition de palier de Flux. */
export async function updateCombats(
  characterId: string,
  delta: 1 | -1,
): Promise<Ok<{ combats: number; palier: number; palierLabel: string; max: number; palierChanged: boolean }>> {
  const { character } = await assertMJOnly(characterId);
  const next = Math.max(0, character.combatsReal + delta);
  const before = getFluxTier(character.fluxTrainings, character.combatsReal);
  const after = getFluxTier(character.fluxTrainings, next);

  await db
    .update(characters)
    .set({ combatsReal: next, updatedAt: new Date() })
    .where(eq(characters.id, characterId));
  revalidateAll();

  return {
    ok: true,
    combats: next,
    palier: after.palier,
    palierLabel: after.label,
    max: after.max,
    palierChanged: after.palier !== before.palier,
  };
}

/** Entraînement technique (MJ). Palier technique. */
export async function updateTechnicalTrainings(
  characterId: string,
  delta: 1 | -1,
): Promise<Ok<{ technicalTrainings: number; palier: number; palierLabel: string; palierChanged: boolean }>> {
  const { character } = await assertMJOnly(characterId);
  const next = Math.max(0, character.technicalTrainings + delta);
  const before = getTechnicalTier(character.technicalTrainings);
  const after = getTechnicalTier(next);

  await db
    .update(characters)
    .set({ technicalTrainings: next, updatedAt: new Date() })
    .where(eq(characters.id, characterId));
  revalidateAll();

  return {
    ok: true,
    technicalTrainings: next,
    palier: after.palier,
    palierLabel: after.label,
    palierChanged: after.palier !== before.palier,
  };
}

/**
 * Ajuste la jauge de Flux courante (dépense d'un sort / régénération).
 * Owner ou MJ. Clampée entre 0 et le max dérivé du palier.
 */
export async function updateFlux(
  characterId: string,
  delta: number,
): Promise<Ok<{ currentFlux: number; maxFlux: number }>> {
  const { character } = await assertCanEdit(characterId);
  const tier = getFluxTier(character.fluxTrainings, character.combatsReal);
  const max = tier.max;
  const next = Math.max(0, Math.min(max, character.currentFlux + delta));

  await db
    .update(characters)
    .set({ currentFlux: next, updatedAt: new Date() })
    .where(eq(characters.id, characterId));
  revalidateAll();

  return { ok: true, currentFlux: next, maxFlux: max };
}
