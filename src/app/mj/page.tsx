import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loadAllCharacters, loadCharacter } from "@/lib/load-character";
import { listTrainingRequestsForMJ } from "@/lib/actions";
import { CockpitShell } from "@/components/cockpit/CockpitShell";
import { MJCharacterClient, PendingTrainingPanel, RosterNav } from "./client";

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
    <CockpitShell
      user={{
        name: session.user.name ?? "",
        role: session.user.role,
        image: session.user.image ?? null,
      }}
      roster={
        <>
          <RosterNav characters={allChars} selectedId={selectedId} />
          <PendingTrainingPanel requests={pendingRequests} />
        </>
      }
    >
      {selected ? (
        <MJCharacterClient character={selected} />
      ) : (
        <div className="campaign-panel p-10 text-center text-sm text-foreground-subtle">
          Aucun personnage. Lance{" "}
          <code className="rounded-sm border border-border bg-background/45 px-1 py-0.5 font-mono text-foreground-muted">
            pnpm db:seed
          </code>{" "}
          pour initialiser le roster.
        </div>
      )}
    </CockpitShell>
  );
}
