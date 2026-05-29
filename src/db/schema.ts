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
  enduranceTrainings: integer("endurance_trainings").default(2).notNull(),
  // vitals runtime (les max sont dérivés)
  currentHp: integer("current_hp").default(45).notNull(),
  currentMental: integer("current_mental").default(45).notNull(),
  currentEndurance: integer("current_endurance").default(250).notNull(),
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
export type PublicRoll = typeof publicRolls.$inferSelect;
