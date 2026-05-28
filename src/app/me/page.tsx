import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { characters, trainingRequests } from "@/db/schema";
import { loadCharacterForUser } from "@/lib/load-character";
import { MyCharacterClient } from "./client";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function claimCharacter(characterId: string) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");

  // Vérifie que le perso est libre
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  });
  if (!char) throw new Error("NOT_FOUND");
  if (char.ownerUserId && char.ownerUserId !== session.user.id) {
    throw new Error("ALREADY_CLAIMED");
  }

  await db.update(characters).set({ ownerUserId: session.user.id }).where(eq(characters.id, characterId));
  revalidatePath("/me");
}

export default async function MePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/me");

  // Si MJ → bascule sur /mj
  if (session.user.role === "mj") redirect("/mj");

  // Charge le perso owned par ce user
  const character = await loadCharacterForUser(session.user.id);

  if (!character) {
    // Affiche la liste des persos non claim
    const availableRows = await db.query.characters.findMany({
      where: isNull(characters.ownerUserId),
    });
    return (
      <main className="relative z-[2] min-h-screen px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-3xl font-bold tracking-wide text-gold-aged">
            Bienvenue, {session.user.name}
          </h1>
          <p className="mt-2 text-sm text-parchment-dim">
            Tu n&apos;as pas encore réclamé de personnage. Choisis le tien&nbsp;:
          </p>
          <div className="mt-6 grid gap-3">
            {availableRows.length === 0 ? (
              <p className="text-sm text-parchment-mute">
                Aucun personnage disponible. Le MJ doit en créer un ou t&apos;assigner manuellement.
              </p>
            ) : (
              availableRows.map((c) => (
                <form key={c.id} action={async () => { "use server"; await claimCharacter(c.id); redirect("/me"); }}>
                  <button
                    type="submit"
                    className="card-grimoire group w-full text-left transition hover:border-gold-aged/30"
                  >
                    <span className="font-display text-lg text-parchment transition-colors group-hover:text-gold-aged">
                      <span aria-hidden className="mr-2 text-gold-soft">✦</span>
                      {c.name}
                    </span>
                  </button>
                </form>
              ))
            )}
          </div>
        </div>
      </main>
    );
  }

  const pendingRow = await db.query.trainingRequests.findFirst({
    where: and(
      eq(trainingRequests.characterId, character.id),
      eq(trainingRequests.status, "pending"),
    ),
  });

  return (
    <MyCharacterClient
      character={character}
      userName={session.user.name ?? ""}
      pendingTraining={
        pendingRow
          ? { id: pendingRow.id, requestedAt: pendingRow.requestedAt, note: pendingRow.note }
          : null
      }
    />
  );
}
