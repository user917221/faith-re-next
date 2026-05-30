import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loadAllCharacters, loadCharacter } from "@/lib/load-character";
import { getCampaignContext, loadStatusNotes } from "@/lib/campaign";
import { listTrainingRequestsForMJ } from "@/lib/actions";
import { CockpitShell } from "@/components/cockpit/CockpitShell";
import {
  CampaignSelector,
  CampaignStatusLive,
  SessionTimerLive,
} from "@/components/cockpit/CampaignControls";
import { StatusNotesPanel } from "@/components/cockpit/StatusNotesPanel";
import {
  MJCharacterClient,
  MJQuickRoll,
  PendingTrainingPanel,
  RosterNav,
} from "./client";

export const dynamic = "force-dynamic";

export default async function MjDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/mj");
  if (session.user.role !== "mj") redirect("/me");

  const [allChars, params, pendingRequests, ctx] = await Promise.all([
    loadAllCharacters(),
    searchParams,
    listTrainingRequestsForMJ(),
    getCampaignContext(),
  ]);
  const selectedId = params.id ?? allChars[0]?.id;
  const [selected, statusNotes] = await Promise.all([
    selectedId ? loadCharacter(selectedId) : Promise.resolve(null),
    selectedId ? loadStatusNotes(selectedId) : Promise.resolve([]),
  ]);

  const sessionDate = ctx.session.date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <CockpitShell
      user={{
        name: session.user.name ?? "",
        role: session.user.role,
        image: session.user.image ?? null,
      }}
      campaignName={ctx.campaign.name}
      sessionNumber={ctx.session.number}
      sessionDate={sessionDate}
      campaignSelector={
        <CampaignSelector
          campaign={{ id: ctx.campaign.id, name: ctx.campaign.name }}
          campaigns={ctx.campaigns}
        />
      }
      campaignStatus={
        <CampaignStatusLive
          campaignId={ctx.campaign.id}
          threatLevel={ctx.campaign.threatLevel}
          morale={ctx.campaign.partyMorale}
          questsActive={ctx.campaign.questsActive}
          downtimeDays={ctx.campaign.downtimeDays}
        />
      }
      sessionTimer={
        <SessionTimerLive
          sessionId={ctx.session.id}
          elapsedSeconds={ctx.session.elapsedSeconds}
          running={ctx.session.running}
        />
      }
      roster={
        <>
          <RosterNav characters={allChars} selectedId={selectedId} />
          <PendingTrainingPanel requests={pendingRequests} />
        </>
      }
      rollPanel={
        selected ? (
          <div className="flex flex-col gap-3">
            <MJQuickRoll characterId={selected.id} characterName={selected.name} />
            <StatusNotesPanel characterId={selected.id} notes={statusNotes} />
          </div>
        ) : undefined
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
