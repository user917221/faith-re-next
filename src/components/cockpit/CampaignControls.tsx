"use client";

/**
 * Versions câblées (cockpit /mj réel) des contrôles de campagne — Phase 5.
 * - CampaignSelector : changer / créer une campagne, avancer la séance.
 * - CampaignStatusLive : menace/moral/quêtes/repos éditables (optimiste).
 * - SessionTimerLive : start/pause persistés.
 */

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, SkipForward } from "lucide-react";
import { toast } from "sonner";
import {
  setActiveCampaign,
  createCampaign,
  advanceSession,
  updateCampaignStatus,
  startSessionTimer,
  pauseSessionTimer,
} from "@/lib/actions";
import { CampaignStatus } from "./CampaignStatus";
import { SessionTimer } from "./SessionTimer";

type CampaignSummary = { id: string; name: string };

export function CampaignSelector({
  campaign,
  campaigns,
}: {
  campaign: CampaignSummary;
  campaigns: CampaignSummary[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  const switchTo = (id: string) => {
    if (id === campaign.id) return setOpen(false);
    startTransition(async () => {
      await setActiveCampaign(id);
      setOpen(false);
      router.refresh();
    });
  };
  const create = () => {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const res = await createCampaign(name);
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      setNewName("");
      setOpen(false);
      toast.success("Campagne créée");
      router.refresh();
    });
  };
  const advance = () => {
    startTransition(async () => {
      const res = await advanceSession(campaign.id);
      if (res.ok) toast.success(`Nouvelle séance — Session ${res.number}`);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-overlay"
      >
        <span className="max-w-[14rem] truncate font-medium">{campaign.name}</span>
        <ChevronDown size={14} className="text-foreground-subtle" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="campaign-panel absolute left-0 z-50 mt-1.5 w-72 p-2 shadow-xl">
            <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
              Campagnes
            </p>
            <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
              {campaigns.map((c) => {
                const active = c.id === campaign.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => switchTo(c.id)}
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                      active
                        ? "bg-primary/12 text-primary"
                        : "text-foreground-muted hover:bg-surface-overlay hover:text-foreground"
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {active && (
                      <span className="ml-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="my-2 border-t border-border" />

            <button
              type="button"
              disabled={isPending}
              onClick={advance}
              className="mb-1.5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground"
            >
              <SkipForward size={13} /> Nouvelle séance
            </button>

            <div className="flex items-center gap-1.5">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder="Nouvelle campagne…"
                maxLength={80}
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/40 focus:outline-none"
              />
              <button
                type="button"
                disabled={isPending || !newName.trim()}
                onClick={create}
                aria-label="Créer la campagne"
                className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function CampaignStatusLive({
  campaignId,
  threatLevel,
  morale,
  questsActive,
  downtimeDays,
}: {
  campaignId: string;
  threatLevel: number;
  morale: number;
  questsActive: number;
  downtimeDays: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [v, setV] = useState({ threatLevel, morale, questsActive, downtimeDays });

  useEffect(() => {
    setV({ threatLevel, morale, questsActive, downtimeDays });
  }, [threatLevel, morale, questsActive, downtimeDays]);

  const apply = (
    local: Partial<typeof v>,
    patch: Parameters<typeof updateCampaignStatus>[1],
  ) => {
    setV((prev) => ({ ...prev, ...local }));
    startTransition(async () => {
      await updateCampaignStatus(campaignId, patch);
      router.refresh();
    });
  };

  return (
    <CampaignStatus
      threatLevel={v.threatLevel}
      morale={v.morale}
      questsActive={v.questsActive}
      downtimeDays={v.downtimeDays}
      onThreatChange={(val) => apply({ threatLevel: val }, { threatLevel: val })}
      onMoraleChange={(val) => apply({ morale: val }, { partyMorale: val })}
      onQuestsChange={(d) => {
        const n = Math.max(0, v.questsActive + d);
        apply({ questsActive: n }, { questsActive: n });
      }}
      onDowntimeChange={(d) => {
        const n = Math.max(0, v.downtimeDays + d);
        apply({ downtimeDays: n }, { downtimeDays: n });
      }}
    />
  );
}

export function SessionTimerLive({
  sessionId,
  elapsedSeconds,
  running,
}: {
  sessionId: string;
  elapsedSeconds: number;
  running: boolean;
}) {
  const router = useRouter();
  return (
    <SessionTimer
      startSeconds={elapsedSeconds}
      running={running}
      onToggle={async (next) => {
        if (next) await startSessionTimer(sessionId);
        else await pauseSessionTimer(sessionId);
        router.refresh();
      }}
    />
  );
}
