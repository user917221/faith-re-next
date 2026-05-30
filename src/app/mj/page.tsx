import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loadAllCharacters, loadCharacter } from "@/lib/load-character";
import { listTrainingRequestsForMJ } from "@/lib/actions";
import { AppShell } from "@/components/app-shell/AppShell";
import { MJCharacterClient, PendingTrainingPanel, RosterNav } from "./client";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MjDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/mj");
  if (session.user.role !== "mj") redirect("/me");

  const [allChars, params, pendingRequests] = await Promise.all([
    loadAllCharacters(),
    searchParams,
    listTrainingRequestsForMJ(),
  ]);
  const selectedId = params.id ?? allChars[0]?.id;
  const selected = selectedId ? await loadCharacter(selectedId) : null;

  return (
    <AppShell
      user={{
        name: session.user.name ?? "",
        role: session.user.role,
        image: session.user.image ?? null,
      }}
      active="mj"
      title="Tableau MJ"
    >
      <div className="grid grid-cols-12 gap-4">
        {/* ========== ROSTER (sidebar interne MJ, col-span-3) ========== */}
        <aside className="col-span-12 lg:col-span-3">
          <RosterNav characters={allChars} selectedId={selectedId} />
        </aside>

        {/* ========== PENDING TRAINING (col-span-9) ========== */}
        <section className="col-span-12 lg:col-span-9">
          <PendingTrainingPanel requests={pendingRequests} />
        </section>

        {/* ========== SELECTED CHARACTER (col-span-12) ========== */}
        <section className="col-span-12">
          {selected ? (
            <MJCharacterClient character={selected} />
          ) : (
            <Card>
              <CardContent className="p-10 text-center text-sm text-ink-tertiary">
                Aucun personnage. Run{" "}
                <code className="font-mono tabular-nums rounded-sm border border-border bg-background/45 px-1 py-0.5 text-muted-foreground">
                  pnpm db:seed
                </code>{" "}
                pour initialiser le roster.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </AppShell>
  );
}
