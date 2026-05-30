import { v0 } from "v0-sdk";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PROMPT = `Build a premium dark RPG character sheet UI — a companion app called "FAITH:RE".
Reference aesthetic: sober dark analytics dashboards (Linear, a dark glass fleet-ops dashboard, Stripe/Apple dark). NOT gamer, NOT neon.

HARD STYLE RULES
- Near-black slate background with subtle depth: faint glass cards, soft diffuse shadows, hairline borders. Absolutely NO neon glow, NO RGB lighting.
- MONOCHROME by default (zinc/slate grays). ONE single accent (refined violet #5e6ad2) used sparingly for the active/primary element only. No multi-color chaos.
- shadcn/ui + Tailwind v4 + Geist font + lucide icons. Consistent rounded corners, dense but airy, generous negative space.
- Vital gauges = SOBER circular rings (like a matte fuel gauge): thin stroke, muted single tone, no glow.

CONTENT (character "Brad", game-master view)
- Header: avatar, name "Brad", fine pill badges (role MJ, Tier "T3", Flux "P2"), subtitle "Niv. 3 - 25 ans". A row of thin stat chips.
- Tabs: Vitaux / Competences / Evolution / Profil.
- Vitaux: 4 circular gauges in one glass card — Sante 125/125, Mental 125/125, Endurance 750/750, Flux 600/750. Each: ring + centered number + small label + tiny minus/amount/plus damage-heal controls. Muted tones, no glow.
- "Depense d'endurance": 8 actions (Physique -10, Offensive Reussie -20, Offensive Non-reussie -30, Offensive Contree -40, Defensive Reussie -10, Defensive Non-reussie -20, Esquive Reussie -5, Esquive Non-reussie -10) as a clean refined list, monochrome, cost in a muted tone — NOT a colorful grid.

Calm, refined, premium. Avoid: neon, glow, saturated red/cyan/green, colorful number grids, generic bootstrap card stacks.`;

const outDir = "/tmp/v0-out";
mkdirSync(outDir, { recursive: true });

console.log("Creating v0 chat…");
const chat = await v0.chats.create({ message: PROMPT });
console.log("CHAT_ID:", chat.id);
console.log("WEB_URL:", chat.webUrl ?? chat.url ?? "(none)");
console.log("chat keys:", Object.keys(chat).join(", "));

let version = chat.latestVersion;
console.log("latestVersion keys:", version ? Object.keys(version).join(", ") : "(none)");

// poll jusqu'à avoir des fichiers
let files = version?.files;
for (let i = 0; i < 20 && (!files || files.length === 0); i++) {
  await new Promise((r) => setTimeout(r, 4000));
  try {
    const fresh = await v0.chats.getById({ chatId: chat.id });
    version = fresh.latestVersion ?? version;
    files = version?.files;
    console.log(`poll ${i}: status=${version?.status ?? "?"} files=${files?.length ?? 0}`);
    if (files && files.length) break;
  } catch (e) {
    console.log("poll error:", e?.message);
  }
}

// fallback download
if ((!files || !files.length) && version?.id) {
  try {
    const dl = await v0.chats.downloadVersion({ chatId: chat.id, versionId: version.id });
    files = dl.files ?? dl;
  } catch (e) {
    console.log("download error:", e?.message);
  }
}

if (files && files.length) {
  const manifest = [];
  for (const f of files) {
    const name = f.name ?? f.path ?? "unnamed";
    const content = f.content ?? f.source ?? f.code ?? "";
    const safe = name.replace(/[\\/]/g, "__");
    writeFileSync(join(outDir, safe), content, "utf8");
    manifest.push(`${name} (${content.length} chars)`);
  }
  console.log("\n=== FILES WRITTEN to /tmp/v0-out ===");
  console.log(manifest.join("\n"));
} else {
  console.log("\nNO FILES. Full chat dump:");
  console.log(JSON.stringify(chat, null, 2).slice(0, 3000));
}
console.log("\nDONE. Open:", chat.webUrl ?? chat.url);
