/**
 * Schema FAITH : RE (Postgres / Neon via Drizzle).
 *
 * - users : compte authentifié (provider Discord). Rôle MJ / joueur / spectateur.
 * - accounts / sessions / verification_tokens : tables Auth.js (drizzle adapter).
 * - characters : un perso est rattaché à un user (owner). Le MJ peut tout voir.
 * - characterSkills : ligne par compétence (20 lignes par perso).
 *
 * Vitals dérivés (max_hp / max_mhp / max_endurance) NE sont PAS stockés —
 * calculés à la volée depuis xp + skills + enduranceTrainings.
 */

import {
  pgTable,
  text,
  integer,
  timestamp,
  primaryKey,
  jsonb,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

export const userRoleEnum = pgEnum("user_role", ["mj", "player", "spectator"]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);
export const runeTypeEnum = pgEnum("rune_type", ["utilitaire", "armement", "predefinie"]);
export const runeRarityEnum = pgEnum("rune_rarity", [
  "commune",
  "rare",
  "epique",
  "legendaire",
]);
export const itemTypeEnum = pgEnum("item_type", [
  "arme",
  "armure",
  "objet",
  "consommable",
]);
export const npcDispositionEnum = pgEnum("npc_disposition", [
  "allie",
  "neutre",
  "hostile",
]);
// Nature d'une condition active (pilote la couleur du chip côté UI).
export const conditionKindEnum = pgEnum("condition_kind", [
  "buff", // bénéfique (vert)
  "debuff", // pénalité (rouge)
  "wound", // blessure / saignement (orange-rouge)
  "focus", // concentration / canalisation (cyan)
  "neutral", // marqueur narratif (gris)
]);

// ---------------- Auth.js tables (drizzle adapter spec) ----------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // FAITH : RE additions
  role: userRoleEnum("role").default("player").notNull(),
  discordId: text("discord_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ---------------- FAITH : RE domain tables ----------------

export const characters = pgTable("character", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: text("owner_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  // identité
  name: text("name").notNull(), // prénom (utilisé pour !commands)
  nom: text("nom").default("").notNull(),
  age: integer("age").default(25).notNull(),
  xp: integer("xp").default(0).notNull(),
  // entraînements (3 axes) : physique (= endurance, existant), flux, technique
  enduranceTrainings: integer("endurance_trainings").default(2).notNull(),
  fluxTrainings: integer("flux_trainings").default(0).notNull(),
  technicalTrainings: integer("technical_trainings").default(0).notNull(),
  // combats réels (condition de palier de Flux)
  combatsReal: integer("combats_real").default(0).notNull(),
  // stats de combat (cockpit MJ — Phase 2)
  initiative: integer("initiative").default(0).notNull(),
  armor: integer("armor").default(0).notNull(),
  movement: integer("movement").default(4).notNull(), // cases / ~5 m
  proficiency: integer("proficiency").default(2).notNull(), // bonus de maîtrise
  // tags d'identité (cockpit MJ — Phase 2 ; édition fine en Phase 6 BIO)
  race: text("race"),
  pronouns: text("pronouns"),
  charClass: text("char_class"),
  // bio libre + notes perso du joueur (Phase 6 ; distinct des status_note MJ)
  bio: text("bio"),
  notes: text("notes"),
  // vitals runtime (les max sont dérivés)
  currentHp: integer("current_hp").default(45).notNull(),
  currentMental: integer("current_mental").default(45).notNull(),
  currentEndurance: integer("current_endurance").default(250).notNull(),
  currentFlux: integer("current_flux").default(100).notNull(),
  // overrides MJ des max vitaux (null = max dérivé par la formule du jeu)
  maxHpOverride: integer("max_hp_override"),
  maxMentalOverride: integer("max_mental_override"),
  maxEnduranceOverride: integer("max_endurance_override"),
  maxFluxOverride: integer("max_flux_override"),
  // narration
  fatePoints: integer("fate_points").default(2).notNull(),
  runes: jsonb("runes").$type<string[]>().default([]).notNull(),
  // intégrations
  discordMessageId: text("discord_message_id"),
  // portrait du personnage (URL ; fallback initiales si null)
  avatarUrl: text("avatar_url"),
  // présence sur le plateau (rejoint la session ON/OFF)
  isPresent: integer("is_present").default(0).notNull(),
  // audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const characterSkills = pgTable(
  "character_skill",
  {
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    skillName: text("skill_name").notNull(),
    points: integer("points").default(1).notNull(),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.skillName] })],
);

// Inventaire de runes — 3 types (utilitaire / armement / prédéfinie).
// Distinct des 3 slots équipés (characters.runes jsonb). Add/remove libre.
export const characterRunes = pgTable("character_rune", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: uuid("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: runeTypeEnum("type").notNull(),
  description: text("description"),
  // attributs de rune (niveau / rareté / dégâts) — pilotés en jeu
  level: integer("level").default(1).notNull(),
  rarity: runeRarityEnum("rarity").default("commune").notNull(),
  damage: text("damage"), // ex. "1d8", "2d6+1", "5" — libre
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Conditions actives d'un perso (états : focalisé, blessé, buff, debuff…).
// Affichées en chips colorés dans le cockpit. Add/remove par MJ ou owner.
export const conditions = pgTable("condition", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: uuid("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  kind: conditionKindEnum("kind").default("neutral").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inventaire d'objets (arme / armure / objet / consommable) — Phase 6.
// Distinct des runes (characters.runes équipées + characterRunes inventaire).
export const items = pgTable("item", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: uuid("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: itemTypeEnum("type").default("objet").notNull(),
  qty: integer("qty").default(1).notNull(),
  equipped: integer("equipped").default(0).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Jets publics : tout user connecté lance, snapshot du nom perso + caster.
// Visibles sur /plateau pour l'ensemble de la table.
export const publicRolls = pgTable("public_roll", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: uuid("character_id").references(() => characters.id, {
    onDelete: "set null",
  }),
  characterName: text("character_name").notNull(),
  casterUserId: text("caster_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  casterName: text("caster_name").notNull(),
  formula: text("formula").notNull(),
  rolls: jsonb("rolls").$type<number[]>().notNull(),
  attrName: text("attr_name"),
  attrScore: integer("attr_score"),
  skillName: text("skill_name"),
  skillScore: integer("skill_score"),
  total: integer("total").notNull(),
  // Difficulté ciblée (DD) — null si pas de DD défini (jet libre)
  dd: integer("dd"),
  // Réussite vs DD — null si pas de DD ; 1 = succès, 0 = échec
  success: integer("success"),
  isCritSucc: integer("is_crit_succ").default(0).notNull(),
  isCritFail: integer("is_crit_fail").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Requêtes d'entraînement endurance : le joueur demande, le MJ approuve/refuse.
// L'approbation déclenche un increment enduranceTrainings (+1) côté Server Action.
export const trainingRequests = pgTable("training_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: uuid("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  requestedBy: text("requested_by")
    .references(() => users.id, { onDelete: "set null" }),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  status: requestStatusEnum("status").default("pending").notNull(),
  decidedBy: text("decided_by").references(() => users.id, { onDelete: "set null" }),
  decidedAt: timestamp("decided_at"),
  note: text("note"),
});

// Campagne : 1 table de jeu = 1 campagne active. Statut narratif (menace,
// moral, quêtes, repos) piloté par le MJ, affiché dans la sidebar cockpit.
export const campaigns = pgTable("campaign", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  threatLevel: integer("threat_level").default(3).notNull(), // 0..5
  partyMorale: integer("party_morale").default(3).notNull(), // 0..5
  questsActive: integer("quests_active").default(0).notNull(),
  downtimeDays: integer("downtime_days").default(0).notNull(),
  isActive: integer("is_active").default(0).notNull(), // une seule active
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Séance de jeu (NB : « session » est pris par Auth.js → `game_session`).
// Minuteur persistant : elapsedSeconds accumulé + timerStartedAt (null = pause).
export const gameSessions = pgTable("game_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  number: integer("number").default(1).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  elapsedSeconds: integer("elapsed_seconds").default(0).notNull(),
  timerStartedAt: timestamp("timer_started_at"), // null = en pause
  isActive: integer("is_active").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notes de statut sur un perso (MJ/joueur) : add/remove, auteur + horodatage.
export const statusNotes = pgTable("status_note", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: uuid("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  authorUserId: text("author_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Journal de campagne : entrées chronologiques (résumés de séance, événements).
export const journalEntries = pgTable("journal_entry", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  sessionNumber: integer("session_number").default(1).notNull(),
  title: text("title").notNull(),
  body: text("body").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// PNJ de campagne : fiche légère (nom, rôle, disposition, description).
export const npcs = pgTable("npc", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role"),
  disposition: npcDispositionEnum("disposition").default("neutre").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------- Relations ----------------

export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  owner: one(users, {
    fields: [characters.ownerUserId],
    references: [users.id],
  }),
  skills: many(characterSkills),
  runesInventory: many(characterRunes),
  conditions: many(conditions),
  statusNotes: many(statusNotes),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  character: one(characters, {
    fields: [items.characterId],
    references: [characters.id],
  }),
}));

export const conditionsRelations = relations(conditions, ({ one }) => ({
  character: one(characters, {
    fields: [conditions.characterId],
    references: [characters.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  sessions: many(gameSessions),
  journalEntries: many(journalEntries),
  npcs: many(npcs),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [journalEntries.campaignId],
    references: [campaigns.id],
  }),
}));

export const npcsRelations = relations(npcs, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [npcs.campaignId],
    references: [campaigns.id],
  }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [gameSessions.campaignId],
    references: [campaigns.id],
  }),
}));

export const statusNotesRelations = relations(statusNotes, ({ one }) => ({
  character: one(characters, {
    fields: [statusNotes.characterId],
    references: [characters.id],
  }),
  author: one(users, {
    fields: [statusNotes.authorUserId],
    references: [users.id],
  }),
}));

export const characterRunesRelations = relations(characterRunes, ({ one }) => ({
  character: one(characters, {
    fields: [characterRunes.characterId],
    references: [characters.id],
  }),
}));

export const characterSkillsRelations = relations(characterSkills, ({ one }) => ({
  character: one(characters, {
    fields: [characterSkills.characterId],
    references: [characters.id],
  }),
}));

export const publicRollsRelations = relations(publicRolls, ({ one }) => ({
  character: one(characters, {
    fields: [publicRolls.characterId],
    references: [characters.id],
  }),
  caster: one(users, {
    fields: [publicRolls.casterUserId],
    references: [users.id],
  }),
}));

export const trainingRequestsRelations = relations(trainingRequests, ({ one }) => ({
  character: one(characters, {
    fields: [trainingRequests.characterId],
    references: [characters.id],
  }),
  requester: one(users, {
    fields: [trainingRequests.requestedBy],
    references: [users.id],
    relationName: "training_requester",
  }),
  decider: one(users, {
    fields: [trainingRequests.decidedBy],
    references: [users.id],
    relationName: "training_decider",
  }),
}));

// ---------------- Inferred types ----------------

export type User = typeof users.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type CharacterSkill = typeof characterSkills.$inferSelect;
export type TrainingRequest = typeof trainingRequests.$inferSelect;
export type CharacterRune = typeof characterRunes.$inferSelect;
export type NewCharacterRune = typeof characterRunes.$inferInsert;
export type RuneRarity = (typeof runeRarityEnum.enumValues)[number];
export type PublicRoll = typeof publicRolls.$inferSelect;
export type Condition = typeof conditions.$inferSelect;
export type NewCondition = typeof conditions.$inferInsert;
export type ConditionKind = (typeof conditionKindEnum.enumValues)[number];
export type Campaign = typeof campaigns.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type StatusNote = typeof statusNotes.$inferSelect;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type Npc = typeof npcs.$inferSelect;
export type NpcDisposition = (typeof npcDispositionEnum.enumValues)[number];
