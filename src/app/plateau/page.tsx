/**
 * /plateau — table de jeu virtuelle.
 *
 * Server Component qui charge le roster + feed des jets, puis délègue
 * l'interactif au client `PlateauClient`. Force-dynamic : on veut un fetch
 * frais à chaque navigation (les rolls et vitals peuvent changer côté MJ).
 *
 * Filtre présence :
 *   - MJ  : voit TOUS les persos (présents et absents, avec opacity réduite)
 *   - Autre : seulement les persos isPresent === true
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters as charactersTable } from "@/db/schema";
import { loadAllCharacters } from "@/lib/load-character";
import { listRecentPublicRolls } from "@/lib/actions/plateau";
import { AppShell } from "@/components/app-shell/AppShell";
import { PlateauClient } from "./client";

export const dynamic = "force-dynamic";

export default async function PlateauPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/plateau");

  const isMJ = session.user.role === "mj";

  const [allCharacters, recentRolls, ownedRow] = await Promise.all([
    loadAllCharacters(),
    listRecentPublicRolls(),
    db.query.characters.findFirst({
      where: eq(charactersTable.ownerUserId, session.user.id),
      columns: { id: true },
    }),
  ]);

  // MJ voit tout, joueur voit seulement les présents
  const characters = isMJ
    ? allCharacters
    : allCharacters.filter((c) => c.isPresent);

  const defaultCharacterId = ownedRow?.id ?? characters[0]?.id ?? "";

  return (
    <AppShell
      user={{
        name: session.user.name ?? "",
        role: session.user.role,
        image: session.user.image ?? null,
      }}
      active="plateau"
      title="Plateau"
    >
      <PlateauClient
        characters={characters}
        initialRolls={recentRolls}
        defaultCharacterId={defaultCharacterId}
        currentUserName={session.user.name ?? ""}
        currentUserId={session.user.id ?? ""}
        ownedCharacterId={ownedRow?.id ?? null}
        isMJ={isMJ}
      />
    </AppShell>
  );
}
