/**
 * Server Actions — contenu de monde de campagne (Phase 7) : journal & PNJ.
 * Réservé MJ (assertMJ). Rattaché à une campagne.
 */

"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { journalEntries, npcs, type NpcDisposition } from "@/db/schema";
import { assertMJ } from "./guards";

type Result<T> = ({ ok: true } & T) | { ok: false; reason: string };

const DISPOSITIONS: NpcDisposition[] = ["allie", "neutre", "hostile"];

// ---------------- Journal ----------------

export async function addJournalEntry(
  campaignId: string,
  input: { title: string; body?: string; sessionNumber?: number },
): Promise<Result<{ id: string }>> {
  await assertMJ();
  const title = (input.title ?? "").trim();
  if (!title) return { ok: false, reason: "Titre requis" };
  if (title.length > 120) return { ok: false, reason: "Titre trop long (120 max)" };

  const [created] = await db
    .insert(journalEntries)
    .values({
      campaignId,
      title,
      body: (input.body ?? "").trim().slice(0, 4000),
      sessionNumber: Math.max(1, Math.round(input.sessionNumber ?? 1)),
    })
    .returning({ id: journalEntries.id });

  revalidatePath("/mj");
  return { ok: true, id: created.id };
}

export async function removeJournalEntry(
  entryId: string,
): Promise<Result<Record<never, never>>> {
  await assertMJ();
  await db.delete(journalEntries).where(eq(journalEntries.id, entryId));
  revalidatePath("/mj");
  return { ok: true };
}

// ---------------- PNJ ----------------

export async function addNpc(
  campaignId: string,
  input: {
    name: string;
    role?: string;
    disposition?: NpcDisposition;
    description?: string;
  },
): Promise<Result<{ id: string }>> {
  await assertMJ();
  const name = (input.name ?? "").trim();
  if (!name) return { ok: false, reason: "Nom requis" };
  if (name.length > 80) return { ok: false, reason: "Nom trop long (80 max)" };
  const disposition: NpcDisposition =
    input.disposition && DISPOSITIONS.includes(input.disposition)
      ? input.disposition
      : "neutre";

  const [created] = await db
    .insert(npcs)
    .values({
      campaignId,
      name,
      role: input.role?.trim().slice(0, 80) || null,
      disposition,
      description: input.description?.trim().slice(0, 2000) || null,
    })
    .returning({ id: npcs.id });

  revalidatePath("/mj");
  return { ok: true, id: created.id };
}

export async function removeNpc(
  npcId: string,
): Promise<Result<Record<never, never>>> {
  await assertMJ();
  await db.delete(npcs).where(eq(npcs.id, npcId));
  revalidatePath("/mj");
  return { ok: true };
}

export async function updateNpc(
  npcId: string,
  patch: {
    name?: string;
    role?: string;
    disposition?: NpcDisposition;
    description?: string;
  },
): Promise<Result<Record<never, never>>> {
  await assertMJ();

  const set: Partial<{
    name: string;
    role: string | null;
    disposition: NpcDisposition;
    description: string | null;
  }> = {};

  if (typeof patch.name === "string") {
    const v = patch.name.trim();
    if (!v) return { ok: false, reason: "Nom requis" };
    set.name = v.slice(0, 80);
  }
  if (typeof patch.role === "string") {
    const v = patch.role.trim();
    set.role = v.length ? v.slice(0, 80) : null;
  }
  if (patch.disposition && DISPOSITIONS.includes(patch.disposition)) {
    set.disposition = patch.disposition;
  }
  if (typeof patch.description === "string") {
    const v = patch.description.trim();
    set.description = v.length ? v.slice(0, 2000) : null;
  }
  if (Object.keys(set).length === 0) return { ok: true };

  await db.update(npcs).set(set).where(eq(npcs.id, npcId));
  revalidatePath("/mj");
  return { ok: true };
}
