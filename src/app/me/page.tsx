import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { characters, trainingRequests } from "@/db/schema";
import { loadCharacterForUser } from "@/lib/load-character";
import { ConstellationGlyph } from "@/components/glyphs";
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
      <main className="relative z-[2] min-h-screen px-6 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Hero card centrée */}
          <section className="card-hero text-center">
            <div className="flex flex-col items-center gap-5">
              <span className="text-gold-aged">
                <ConstellationGlyph size={120} />
              </span>
              <div className="flex flex-col gap-2">
                <span className="label-grimoire">Convocation</span>
                <h1 className="font-display text-4xl font-bold tracking-[0.02em] text-gold-aged">
                  Bienvenue, {session.user.name}
                </h1>
                <p className="mx-auto max-w-md text-sm text-parchment-dim leading-relaxed">
                  Tu n&apos;as pas encore réclamé de personnage. Choisis le tien
                  parmi le grimoire de la table.
                </p>
              </div>
            </div>
          </section>

          {/* Liste portfolio des persos */}
          <div className="mt-8">
            {availableRows.length === 0 ? (
              <p className="card-grimoire text-center text-sm italic text-parchment-mute">
                Aucun personnage disponible. Le MJ doit en créer un ou
                t&apos;assigner manuellement.
              </p>
            ) : (
              <div className="card-grimoire list-portfolio !p-0">
                {availableRows.map((c) => (
                  <form
                    key={c.id}
                    action={async () => {
                      "use server";
                      await claimCharacter(c.id);
                      redirect("/me");
                    }}
                  >
                    <button
                      type="submit"
                      className="group flex w-full items-center justify-between gap-3 text-left"
                    >
                      <span className="flex items-center gap-4">
                        <span
                          aria-hidden
                          className="font-display tabular text-[0.7rem] uppercase tracking-[0.18em] text-parchment-mute transition-colors group-hover:text-gold-aged"
                        >
                          ✦
                        </span>
                        <span className="font-display text-lg tracking-wide text-parchment transition-colors group-hover:text-gold-aged">
                          {c.name}
                        </span>
                      </span>
                      <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-parchment-mute transition-colors group-hover:text-gold-aged">
                        Réclamer →
                      </span>
                    </button>
                  </form>
                ))}
              </div>
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
