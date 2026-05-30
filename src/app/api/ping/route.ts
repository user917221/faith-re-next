import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Ping anti-cold-start — réveille / garde chaude la base Neon (`SELECT 1`).
 * Appelé périodiquement par le bouton « Allumer la table » (KeepWarmToggle)
 * tant qu'un joueur connecté garde l'app ouverte. Réservé aux utilisateurs
 * authentifiés (évite tout martèlement anonyme de la DB).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ ok: false }, { status: 401 });
  }
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
