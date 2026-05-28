/**
 * Auth.js v5 — provider Discord, drizzle adapter, role MJ promu via env MJ_DISCORD_ID.
 *
 * Usage côté server :
 *   import { auth } from "@/lib/auth";
 *   const session = await auth();
 *
 * Usage côté client :
 *   import { signIn, signOut } from "next-auth/react";
 */

import NextAuth, { type DefaultSession } from "next-auth";
import Discord from "next-auth/providers/discord";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "mj" | "player" | "spectator";
      discordId: string | null;
    } & DefaultSession["user"];
  }
}

const MJ_DISCORD_ID = process.env.MJ_DISCORD_ID || "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),
  ],
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      // Attach role + discordId au payload session.
      session.user.id = user.id;
      // @ts-expect-error — la colonne role est ajoutée au users (cf. schema.ts)
      session.user.role = user.role ?? "player";
      // @ts-expect-error — discord_id col custom
      session.user.discordId = user.discordId ?? null;
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      // À chaque login Discord, synchronise discord_id + role MJ si match.
      if (account?.provider === "discord" && account.providerAccountId && user.id) {
        const discordId = account.providerAccountId;
        const isMJ = MJ_DISCORD_ID && discordId === MJ_DISCORD_ID;
        await db
          .update(users)
          .set({
            discordId,
            role: isMJ ? "mj" : "player",
          })
          .where(eq(users.id, user.id));
      }
    },
  },
  pages: {
    signIn: "/signin",
  },
});
