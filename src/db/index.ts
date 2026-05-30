import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Client Drizzle/Neon.
 *
 * Si DATABASE_URL n'est pas défini (typiquement pendant le build CI sans
 * variables d'env runtime, ou pendant un éventuel `pnpm tsc` sec), on
 * instancie quand même un client avec un URL stub. Aucune connexion réelle
 * n'est établie tant qu'on n'appelle pas de requête — le premier `db.query.*`
 * échouera explicitement si la vraie URL n'est pas configurée.
 */
const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://stub:stub@stub.invalid/stub";

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  console.warn(
    "[db] DATABASE_URL absent — utilisation d'un client stub. Copie .env.example vers .env.local pour exécuter des requêtes réelles.",
  );
}

const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });

export * from "./schema";
