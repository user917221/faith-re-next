"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { ITEM_TYPES, type ItemType } from "@/lib/items";
import { assertCanEdit } from "./guards";

function revalidateAll() {
  revalidatePath("/me");
  revalidatePath("/mj");
}

type Result<T> = ({ ok: true } & T) | { ok: false; reason: string };

/** Ajoute un objet à l'inventaire (owner ou MJ). */
export async function addItem(
  characterId: string,
  input: { name: string; type: ItemType; qty?: number; description?: string },
): Promise<Result<{ id: string }>> {
  await assertCanEdit(characterId);
  const name = input.name?.trim();
  if (!name) return { ok: false, reason: "Nom d'objet requis" };
  if (!ITEM_TYPES.includes(input.type)) {
    return { ok: false, reason: "Type d'objet invalide" };
  }
  const qty = Math.max(1, Math.min(999, Math.round(input.qty ?? 1)));

  const [created] = await db
    .insert(items)
    .values({
      characterId,
      name: name.slice(0, 80),
      type: input.type,
      qty,
      description: input.description?.trim() || null,
    })
    .returning({ id: items.id });

  revalidateAll();
  return { ok: true, id: created.id };
}

/** Retire un objet de l'inventaire (owner ou MJ). */
export async function removeItem(
  characterId: string,
  itemId: string,
): Promise<Result<Record<never, never>>> {
  await assertCanEdit(characterId);
  await db.delete(items).where(eq(items.id, itemId));
  revalidateAll();
  return { ok: true };
}

/** Bascule l'état équipé d'un objet (owner ou MJ). */
export async function toggleEquip(
  characterId: string,
  itemId: string,
): Promise<Result<{ equipped: boolean }>> {
  await assertCanEdit(characterId);
  const item = await db.query.items.findFirst({ where: eq(items.id, itemId) });
  if (!item || item.characterId !== characterId) {
    return { ok: false, reason: "Objet introuvable" };
  }
  const next = item.equipped === 1 ? 0 : 1;
  await db.update(items).set({ equipped: next }).where(eq(items.id, itemId));
  revalidateAll();
  return { ok: true, equipped: next === 1 };
}

/** Ajuste la quantité d'un objet (supprime si ≤ 0). */
export async function updateItemQty(
  characterId: string,
  itemId: string,
  delta: number,
): Promise<Result<{ qty: number; removed: boolean }>> {
  await assertCanEdit(characterId);
  const item = await db.query.items.findFirst({ where: eq(items.id, itemId) });
  if (!item || item.characterId !== characterId) {
    return { ok: false, reason: "Objet introuvable" };
  }
  const next = item.qty + Math.round(delta);
  if (next <= 0) {
    await db.delete(items).where(eq(items.id, itemId));
    revalidateAll();
    return { ok: true, qty: 0, removed: true };
  }
  const qty = Math.min(999, next);
  await db.update(items).set({ qty }).where(eq(items.id, itemId));
  revalidateAll();
  return { ok: true, qty, removed: false };
}
