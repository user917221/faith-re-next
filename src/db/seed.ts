/**
 * Seed FAITH : RE — roster initial (Brad / Corentin / Mathys / Yazid).
 *
 * Idempotent : skip si le perso existe déjà (lookup par `name`).
 * Crée chaque perso avec ses 20 skills à 1 pt.
 *
 * Usage : `pnpm db:seed`
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { characters, characterSkills } from "./schema";
import { ALL_SKILLS } from "../lib/skills";

const INITIAL_ROSTER = [
  { name: "Brad", fatePoints: 2 },
  { name: "Corentin", fatePoints: 1 },
  { name: "Mathys", fatePoints: 3 },
  { name: "Yazid", fatePoints: 2 },
];

async function seed() {
  console.log("Seeding FAITH : RE roster…");

  for (const proto of INITIAL_ROSTER) {
    const existing = await db.query.characters.findFirst({
      where: eq(characters.name, proto.name),
    });

    if (existing) {
      console.log(`  - ${proto.name} existe déjà (id=${existing.id}), skip`);
      continue;
    }

    const [created] = await db
      .insert(characters)
      .values({
        name: proto.name,
        nom: "",
        age: 25,
        xp: 0,
        enduranceTrainings: 2,
        fatePoints: proto.fatePoints,
        runes: ["", "", ""],
      })
      .returning();

    console.log(`  + ${proto.name} créé (id=${created.id})`);

    if (ALL_SKILLS.length > 0) {
      await db.insert(characterSkills).values(
        ALL_SKILLS.map((skillName) => ({
          characterId: created.id,
          skillName,
          points: 1,
        })),
      );
      console.log(`    -> ${ALL_SKILLS.length} skills à 1 pt`);
    }
  }

  console.log("Seed terminé.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
