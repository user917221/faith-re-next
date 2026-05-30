"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { assertCanEdit } from "./guards";

type ProfilePatch = {
  name?: string;
  nom?: string;
  age?: number;
  race?: string;
  pronouns?: string;
  charClass?: string;
  bio?: string;
  notes?: string;
};

// Normalise un tag d'identité optionnel : trim, cap 40, vide → null (effacement).
function tag(v: string): string | null {
  const t = v.trim();
  return t.length ? t.slice(0, 40) : null;
}

export async function updateProfile(
  characterId: string,
  patch: ProfilePatch,
): Promise<{ ok: true; character: { name: string; nom: string; age: number } } | { ok: false; reason: string }> {
  await assertCanEdit(characterId);

  const update: Partial<{
    name: string;
    nom: string;
    age: number;
    race: string | null;
    pronouns: string | null;
    charClass: string | null;
    bio: string | null;
    notes: string | null;
    updatedAt: Date;
  }> = {
    updatedAt: new Date(),
  };

  if (typeof patch.name === "string") {
    const v = patch.name.trim();
    if (!v) return { ok: false, reason: "Prénom requis" };
    if (v.length > 60) return { ok: false, reason: "Prénom trop long (max 60)" };
    update.name = v;
  }
  if (typeof patch.nom === "string") {
    const v = patch.nom.trim();
    if (v.length > 80) return { ok: false, reason: "Nom trop long (max 80)" };
    update.nom = v;
  }
  if (typeof patch.age === "number" && Number.isFinite(patch.age)) {
    if (patch.age < 1 || patch.age > 999) return { ok: false, reason: "Âge hors plage (1–999)" };
    update.age = Math.floor(patch.age);
  }
  if (typeof patch.race === "string") update.race = tag(patch.race);
  if (typeof patch.pronouns === "string") update.pronouns = tag(patch.pronouns);
  if (typeof patch.charClass === "string") update.charClass = tag(patch.charClass);
  if (typeof patch.bio === "string") {
    const v = patch.bio.trim();
    update.bio = v.length ? v.slice(0, 1000) : null;
  }
  if (typeof patch.notes === "string") {
    const v = patch.notes.trim();
    update.notes = v.length ? v.slice(0, 1000) : null;
  }

  const [row] = await db
    .update(characters)
    .set(update)
    .where(eq(characters.id, characterId))
    .returning({ name: characters.name, nom: characters.nom, age: characters.age });

  revalidatePath("/me");
  revalidatePath("/mj");

  return { ok: true, character: row };
}
