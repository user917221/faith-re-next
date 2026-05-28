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

// ---------------- Inferred types ----------------

export type User = typeof users.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type CharacterSkill = typeof characterSkills.$inferSelect;
