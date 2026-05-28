/**
 * Discord Webhook utilities pour FAITH : RE.
 *
 * Module pur (PAS de `'use server'`) importable depuis les Server Actions.
 * Trois fonctions exposées :
 *   - syncCharacterEmbed → POST (création) OU PATCH (mise à jour) du message fiche
 *   - pushActionLog      → POST d'un embed d'action (dépense endurance)
 *   - pushRollResult     → POST d'un embed de résultat de jet
 *
 * Convention : si `character.discordMessageId` est défini, on PATCH le message
 * existant et on retourne le même id. Sinon on POST avec `?wait=true` afin
 * de récupérer l'objet message Discord et son `id`.
 */

import { SKILL_GROUPS, calculateAttribute, type AttributeName } from "./skills";
import {
  calculateLevel,
  getLevelBonus,
  getEnduranceTier,
} from "./faith-system";

// ---------------- Types ----------------

export type CharacterPayload = {
  id: string;
  name: string;
  nom?: string | null;
  age: number;
  xp: number;
  enduranceTrainings: number;
  currentHp: number;
  currentMental: number;
  currentEndurance: number;
  /** Optionnels : si absents, recalculés depuis xp + skills + enduranceTrainings. */
  maxHp?: number;
  maxMental?: number;
  maxEndurance?: number;
  fatePoints: number;
  runes: string[];
  skills: Record<string, number>;
  discordMessageId?: string | null;
};

export type SyncOptions = {
  /** Si true, affiche les infos d'endurance (réservées au MJ). */
  mjMode?: boolean;
};

type DiscordEmbed = {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
};

type DiscordWebhookMessage = {
  id: string;
  [key: string]: unknown;
};

// ---------------- Constantes ----------------

const BOT_USERNAME = "FAITH : RE Bot";
const COLOR_GOLD = 0xfbbf24;
const COLOR_RED = 0xef4444;

// ---------------- Helpers de format ----------------

function fullName(char: CharacterPayload): string {
  return `${char.name}${char.nom ? ` ${char.nom}` : ""}`;
}

function resolveMaxHp(char: CharacterPayload, level: number): number {
  if (typeof char.maxHp === "number") return char.maxHp;
  return 40 + getLevelBonus(level) + calculateAttribute(char.skills, "CONSTITUTION");
}

function resolveMaxMental(char: CharacterPayload, level: number): number {
  if (typeof char.maxMental === "number") return char.maxMental;
  return 40 + getLevelBonus(level) + calculateAttribute(char.skills, "PSYCHÉ");
}

function fateStars(fatePoints: number): string {
  const clamped = Math.max(0, Math.min(5, fatePoints));
  return "★".repeat(clamped) + "☆".repeat(5 - clamped);
}

// ---------------- Builders d'embed ----------------

function buildCharacterEmbed(
  char: CharacterPayload,
  mjMode: boolean,
): DiscordEmbed {
  const level = calculateLevel(char.xp);
  const tier = getEnduranceTier(char.enduranceTrainings);
  const maxHp = resolveMaxHp(char, level);
  const maxMental = resolveMaxMental(char, level);

  const vitalityValue =
    `HP : \`${char.currentHp} / ${maxHp}\`\n` +
    `MHP : \`${char.currentMental} / ${maxMental}\`\n` +
    `Fate : ${fateStars(char.fatePoints)}`;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    {
      name: "❤️ Vitalité",
      value: vitalityValue,
      inline: true,
    },
  ];

  if (mjMode) {
    fields.push({
      name: "🔒 Endurance (MJ)",
      value:
        `\`${char.currentEndurance} / ${tier.max}\` (${tier.label})\n` +
        `Entraînements : ${char.enduranceTrainings}`,
      inline: true,
    });
  }

  // 4 attributs × leurs skills
  for (const [attr, skills] of Object.entries(SKILL_GROUPS)) {
    const score = calculateAttribute(char.skills, attr as AttributeName);
    fields.push({
      name: `🎯 ${attr} (${score})`,
      value: skills
        .map((sk) => `• ${sk} : \`${char.skills[sk] ?? 0}\``)
        .join("\n"),
      inline: true,
    });
  }

  const runesLines = char.runes.filter(Boolean).map((r) => `• ${r}`);
  fields.push({
    name: "✦ Runes",
    value: runesLines.length ? runesLines.join("\n") : "*Aucune Rune équipée*",
    inline: false,
  });

  return {
    title: `🎴 ${fullName(char)}`,
    description: `Niveau **${level}** · ${char.age} ans`,
    color: COLOR_GOLD,
    fields,
    footer: { text: "FAITH : RE Companion" },
    timestamp: new Date().toISOString(),
  };
}

function buildActionEmbed(
  char: CharacterPayload,
  payload: { actionLabel: string; cost: number },
  mjMode: boolean,
): DiscordEmbed {
  const tier = getEnduranceTier(char.enduranceTrainings);
  const fields: { name: string; value: string; inline?: boolean }[] = [];

  if (mjMode) {
    fields.push({
      name: "🔒 Restant",
      value: `\`${char.currentEndurance} / ${tier.max}\``,
      inline: true,
    });
  }

  return {
    title: "💥 Dépense d'Endurance",
    description: `**${fullName(char)}** a effectué une **${payload.actionLabel}** (\`-${payload.cost} Endu\`).`,
    color: COLOR_RED,
    fields,
    timestamp: new Date().toISOString(),
  };
}

function buildRollEmbed(
  char: CharacterPayload,
  payload: {
    formula: string;
    rolls: number[];
    attrName?: string;
    attrScore?: number;
    skillName?: string | null;
    skillScore?: number;
    total: number;
    isCritSucc?: boolean;
    isCritFail?: boolean;
  },
): DiscordEmbed {
  const rollSum = payload.rolls.reduce((acc, n) => acc + n, 0);
  const rollsStr = `[${payload.rolls.join(", ")}]`;

  const parts: string[] = [`Dés : \`${rollsStr}\` (${rollSum})`];
  if (typeof payload.attrScore === "number" && payload.attrName) {
    parts.push(`Attribut ${payload.attrName} : \`+${payload.attrScore}\``);
  }
  if (payload.skillName && typeof payload.skillScore === "number") {
    parts.push(`Skill ${payload.skillName} : \`+${payload.skillScore}\``);
  }
  parts.push(`👉 **Total : ${payload.total}**`);
  const breakdownString = parts.join("\n");

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "Formule", value: `\`${payload.formula}\``, inline: true },
    { name: "Résultat", value: breakdownString, inline: false },
  ];

  if (payload.isCritSucc) {
    fields.push({
      name: "👑 RÉUSSITE CRITIQUE",
      value: "Double 6 ! Le destin sourit aux audacieux.",
      inline: false,
    });
  }
  if (payload.isCritFail) {
    fields.push({
      name: "💀 ÉCHEC CATASTROPHIQUE",
      value: "Double 1 ! L'Impôt Divin réclame son dû.",
      inline: false,
    });
  }

  return {
    title: `🎲 Jet : ${payload.skillName ?? payload.attrName ?? "Formule"}`,
    description: `**${fullName(char)}** effectue un test !`,
    color: COLOR_GOLD,
    fields,
    timestamp: new Date().toISOString(),
  };
}

// ---------------- Fetch helpers ----------------

async function postWebhook(
  webhookUrl: string,
  embed: DiscordEmbed,
): Promise<DiscordWebhookMessage> {
  const res = await fetch(`${webhookUrl}?wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: BOT_USERNAME,
      embeds: [embed],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Discord webhook POST ${res.status} ${res.statusText}: ${body}`,
    );
  }
  return (await res.json()) as DiscordWebhookMessage;
}

async function patchWebhookMessage(
  webhookUrl: string,
  messageId: string,
  embed: DiscordEmbed,
): Promise<void> {
  const res = await fetch(`${webhookUrl}/messages/${messageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Discord webhook PATCH ${res.status} ${res.statusText}: ${body}`,
    );
  }
}

// ---------------- Public API ----------------

/**
 * Crée OU met à jour le message Discord embed de la fiche perso.
 * - Si `character.discordMessageId` est défini → PATCH, retourne le même id.
 * - Sinon → POST + retourne le nouveau messageId.
 */
export async function syncCharacterEmbed(
  webhookUrl: string,
  character: CharacterPayload,
  options?: SyncOptions,
): Promise<{ messageId: string }> {
  const mjMode = options?.mjMode ?? false;
  const embed = buildCharacterEmbed(character, mjMode);

  if (character.discordMessageId) {
    await patchWebhookMessage(webhookUrl, character.discordMessageId, embed);
    return { messageId: character.discordMessageId };
  }

  const created = await postWebhook(webhookUrl, embed);
  return { messageId: created.id };
}

/** Push un nouveau message d'action (POST non-persistant). */
export async function pushActionLog(
  webhookUrl: string,
  character: CharacterPayload,
  payload: { actionLabel: string; cost: number },
  options?: SyncOptions,
): Promise<void> {
  const mjMode = options?.mjMode ?? false;
  const embed = buildActionEmbed(character, payload, mjMode);
  await postWebhook(webhookUrl, embed);
}

/** Push un résultat de jet (POST non-persistant). */
export async function pushRollResult(
  webhookUrl: string,
  character: CharacterPayload,
  payload: {
    formula: string;
    rolls: number[];
    attrName?: string;
    attrScore?: number;
    skillName?: string | null;
    skillScore?: number;
    total: number;
    isCritSucc?: boolean;
    isCritFail?: boolean;
  },
): Promise<void> {
  const embed = buildRollEmbed(character, payload);
  await postWebhook(webhookUrl, embed);
}
