import type { Config } from "drizzle-kit";
import { config } from "dotenv";

// Charge .env.local (utilisé par Next.js + Vercel pull) ET .env en fallback.
config({ path: [".env.local", ".env"] });

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
