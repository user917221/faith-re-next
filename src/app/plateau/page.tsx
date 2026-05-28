/**
 * /plateau — table de jeu virtuelle.
 *
 * Server Component qui charge le roster + feed des jets, puis délègue
 * l'interactif au client `PlateauClient`. Force-dynamic : on veut un fetch
 * frais à chaque navigation (les rolls et vitals peuvent changer côté MJ).
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters as charactersTable } from "@/db/schema";
import { loadAllCharacters } from "@/lib/load-character";
import { listRecentPublicRolls } from "@/lib/actions/plateau";
import { PlateauClient } from "./client";

export const dynamic = "force-dynamic";

export default async function PlateauPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/plateau");

  const [characters, recentRolls, ownedRow] = await Promise.all([
    loadAllCharacters(),
    listRecentPublicRolls(),
    db.query.characters.findFirst({
      where: eq(charactersTable.ownerUserId, session.user.id),
      columns: { id: true },
    }),
  ]);

  const defaultCharacterId = ownedRow?.id ?? characters[0]?.id ?? "";

  return (
    <PlateauClient
      characters={characters}
      initialRolls={recentRolls}
      defaultCharacterId={defaultCharacterId}
      currentUserName={session.user.name ?? ""}
      isMJ={session.user.role === "mj"}
    />
  );
}
