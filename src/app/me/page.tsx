import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { characters, trainingRequests } from "@/db/schema";
import { loadCharacterForUser } from "@/lib/load-character";
import { AppShell } from "@/components/app-shell/AppShell";
import { MyCharacterClient } from "./client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Sparkles } from "lucide-react";
import { avatarFallbackStyle, initialsOf } from "@/lib/avatar";
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

  const shellUser = {
    name: session.user.name ?? "",
    role: session.user.role,
    image: session.user.image ?? null,
  };

  // Charge le perso owned par ce user
  const character = await loadCharacterForUser(session.user.id);

  if (!character) {
    // Affiche la liste des persos non claim
    const availableRows = await db.query.characters.findMany({
      where: isNull(characters.ownerUserId),
    });
    return (
      <AppShell user={shellUser} active="me" title="Ma fiche">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          {availableRows.length === 0 ? (
            <Empty className="border border-border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Sparkles className="text-ink-tertiary" />
                </EmptyMedia>
                <EmptyTitle>Aucun personnage disponible</EmptyTitle>
                <EmptyDescription>
                  Le MJ doit en créer un ou te l&apos;assigner manuellement.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Empty className="border border-border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Sparkles className="text-ink-tertiary" />
                </EmptyMedia>
                <EmptyTitle>Réclame ton personnage</EmptyTitle>
                <EmptyDescription>
                  Tu n&apos;as pas encore de personnage. Choisis le tien parmi le
                  grimoire de la table.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="w-full overflow-hidden rounded-lg border border-border bg-background">
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
                        className="group flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback style={avatarFallbackStyle(c.name)}>
                              {initialsOf(c.name, c.nom)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium tracking-tight text-foreground">
                              {c.name}
                            </span>
                            {c.nom ? (
                              <span className="truncate text-xs text-ink-tertiary">
                                {c.nom}
                              </span>
                            ) : null}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                          Réclamer →
                        </span>
                      </button>
                    </form>
                  ))}
                </div>
              </EmptyContent>
            </Empty>
          )}
        </div>
      </AppShell>
    );
  }

  const pendingRow = await db.query.trainingRequests.findFirst({
    where: and(
      eq(trainingRequests.characterId, character.id),
      eq(trainingRequests.status, "pending"),
    ),
  });

  return (
    <AppShell user={shellUser} active="me" title="Ma fiche">
      <MyCharacterClient
        character={character}
        pendingTraining={
          pendingRow
            ? { id: pendingRow.id, requestedAt: pendingRow.requestedAt, note: pendingRow.note }
            : null
        }
      />
    </AppShell>
  );
}
