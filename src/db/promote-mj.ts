/**
 * Diagnostic + promotion MJ.
 *
 * 1. Liste tous les users connus (id, name, discord_id, role).
 * 2. Pour chaque user dont le discord_id est dans MJ_DISCORD_ID env,
 *    bascule role = 'mj' s'il ne l'est pas déjà.
 *
 * Lancer avec : pnpm tsx --env-file=.env.local src/db/promote-mj.ts
 * (ou via dotenv-cli, configuré dans package.json).
 */

import { db } from "./index";
import { users } from "./schema";
import { inArray } from "drizzle-orm";

const MJ_IDS = (process.env.MJ_DISCORD_ID || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function main() {
  console.log(`MJ_DISCORD_ID env = "${process.env.MJ_DISCORD_ID}"`);
  console.log(`Parsed list (${MJ_IDS.length}) : ${JSON.stringify(MJ_IDS)}`);

  const all = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    discordId: users.discordId,
    role: users.role,
  }).from(users);

  console.log("\nUsers actuels :");
  for (const u of all) {
    const match = u.discordId && MJ_IDS.includes(u.discordId);
    console.log(
      `  - ${u.name ?? "(no name)"} (${u.email ?? "no email"}) · discordId=${u.discordId} · role=${u.role} ${match ? "← MATCH MJ" : ""}`,
    );
  }

  if (MJ_IDS.length === 0) {
    console.log("\nMJ_DISCORD_ID env vide → impossible de matcher.");
    process.exit(1);
  }

  const updated = await db
    .update(users)
    .set({ role: "mj" })
    .where(inArray(users.discordId, MJ_IDS))
    .returning({ id: users.id, name: users.name, discordId: users.discordId, role: users.role });

  console.log(`\nPromotions appliquées : ${updated.length}`);
  for (const u of updated) {
    console.log(`  ✓ ${u.name} (discordId=${u.discordId}) → ${u.role}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
