"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTransition } from "react";
import CharacterSheet from "@/components/character-sheet";
import type { Character, ProfilePatch } from "@/components/character-sheet/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuickRollPanel } from "@/components/cockpit/QuickRollPanel";
import { ModificationsPanel } from "@/components/cockpit/ModificationsPanel";
import {
  CreateCharacterDialog,
  DeleteCharacterDialog,
} from "@/components/cockpit/RosterActionsDialog";
import { toast } from "sonner";
import { Inbox } from "lucide-react";
import { avatarFallbackStyle, initialsOf } from "@/lib/avatar";
import { rollPublicPool } from "@/lib/actions/plateau";
import {
  updateSkill,
  updateVital,
  applyEnduranceAction,
  updateXp,
  updateTrainings,
  updateFatePoints,
  updateRunes,
  updateProfile,
  approveTraining,
  rejectTraining,
  recoverHp,
  recoverEndurance,
  togglePresence,
  rollSkillWithDD,
  updateFlux,
  updateFluxTrainings,
  updateCombats,
  updateTechnicalTrainings,
  addRune,
  removeRune,
  updateRune,
  updateLightCrystals,
  addCompetenceAlea,
  removeCompetenceAlea,
  updateCombatStats,
  addCondition,
  removeCondition,
  addItem,
  removeItem,
  toggleEquip,
  updateItemQty,
  type TrainingRequestWithChar,
} from "@/lib/actions";

function pct(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

/* ============================================================
 * RosterNav — sidebar interne du MJ (distincte de la sidebar shell).
 * Ligne dense : Avatar + LED présence + nom + barre HP + Badge Niv.
 * HoverCard : preview synthétique (vitaux tabular, niveau, nb compétences).
 * ============================================================ */
export function RosterNav({
  characters,
  selectedId,
  isMJ = true,
}: {
  characters: Character[];
  selectedId?: string;
  isMJ?: boolean;
}) {
  const presentCount = characters.filter((c) => c.isPresent).length;

  return (
    <div className="campaign-panel sticky top-[5rem]">
      <header className="campaign-header-line flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="label-grimoire">Roster</p>
          <span className="tabular text-xs text-ink-tertiary">
            <span className="text-foreground">{characters.length}</span> / 4
          </span>
        </div>
        {isMJ && <CreateCharacterDialog />}
      </header>

      <ScrollArea className="max-h-[calc(100vh-13rem)]">
        <nav className="list-portfolio" aria-label="Liste des personnages">
          {characters.map((c) => {
            const isActive = c.id === selectedId;
            const hpPct = pct(c.currentHp, c.maxHp);
            const hpCritical = hpPct < 25;
            const skillCount = Object.values(c.skills).filter((p) => p > 0).length;

            return (
              <HoverCard key={c.id} openDelay={120} closeDelay={60}>
                <HoverCardTrigger asChild>
                  <div
                    className={`group flex items-stretch border-l-2 transition-colors ${
                      isActive
                        ? "border-l-primary bg-primary/10"
                        : "border-l-transparent hover:bg-surface-overlay/40"
                    }`}
                  >
                    <Link
                      href={`/mj?id=${c.id}`}
                      aria-current={isActive ? "page" : undefined}
                      className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span className="relative shrink-0">
                        <Avatar size="sm" className="rounded-md">
                          <AvatarImage src={c.avatarUrl ?? undefined} alt={c.name} />
                          <AvatarFallback
                            className="rounded-md text-2xs"
                            style={avatarFallbackStyle(c.name)}
                          >
                            {initialsOf(c.name, c.nom)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          aria-hidden
                          className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-card ${
                            c.isPresent ? "presence-led-on" : "presence-led-off"
                          }`}
                        />
                      </span>

                      {/* Nom + Niv (ligne 1) · barre HP (ligne 2) */}
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="flex items-center gap-2">
                          <span
                            className={`truncate text-sm font-medium tracking-tight ${
                              isActive
                                ? "text-foreground"
                                : "text-ink-muted group-hover:text-foreground"
                            }`}
                          >
                            {c.name}
                          </span>
                          <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
                            Niv.&nbsp;{c.level}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-overlay">
                            <span
                              className={`block h-full rounded-full transition-[width] duration-300 ${
                                hpPct > 50
                                  ? "bg-endu"
                                  : hpPct >= 25
                                    ? "bg-primary"
                                    : "bg-hp"
                              }`}
                              style={{ width: `${hpPct}%` }}
                            />
                          </span>
                          <span className="shrink-0 font-mono text-[10px] tabular-nums slashed-zero">
                            <span
                              className={
                                c.currentHp < 0
                                  ? ""
                                  : hpCritical
                                    ? "text-hp"
                                    : "text-foreground-muted"
                              }
                              style={
                                c.currentHp < 0
                                  ? { color: "var(--mhp)" }
                                  : undefined
                              }
                            >
                              {c.currentHp}
                            </span>
                            <span className="text-ink-tertiary/60">/{c.maxHp}</span>
                          </span>
                        </span>
                      </span>
                    </Link>

                    {/* Supprimer — colonne dédiée (pas de chevauchement) */}
                    {isMJ && (
                      <div className="flex shrink-0 items-center pr-1.5">
                        <DeleteCharacterDialog
                          characterId={c.id}
                          characterName={c.name}
                          isSelected={isActive}
                        />
                      </div>
                    )}
                  </div>
                </HoverCardTrigger>

                {/* Preview synthétique au survol */}
                <HoverCardContent side="right" align="start" className="w-60 p-0">
                  <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
                    <Avatar size="default" className="rounded-md">
                      <AvatarImage src={c.avatarUrl ?? undefined} alt={c.name} />
                      <AvatarFallback
                        className="rounded-md text-xs"
                        style={avatarFallbackStyle(c.name)}
                      >
                        {initialsOf(c.name, c.nom)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium tracking-tight text-foreground">
                        {c.name}
                        {c.nom ? (
                          <span className="font-normal text-ink-tertiary"> {c.nom}</span>
                        ) : null}
                      </p>
                      <p className="flex items-center gap-1.5 text-2xs text-ink-tertiary">
                        <span
                          aria-hidden
                          className={`h-1.5 w-1.5 rounded-full ${
                            c.isPresent ? "presence-led-on" : "presence-led-off"
                          }`}
                        />
                        {c.isPresent ? "Présent" : "Absent"}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 tabular text-muted-foreground">
                      Niv. {c.level}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-border">
                    <PreviewStat label="PV" value={c.currentHp} max={c.maxHp} tone="text-hp" />
                    <PreviewStat
                      label="PM"
                      value={c.currentMental}
                      max={c.maxMental}
                      tone="text-mhp"
                    />
                    <PreviewStat
                      label="END"
                      value={c.currentEndurance}
                      max={c.maxEndurance}
                      tone="text-endu"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2 text-2xs">
                    <span className="text-ink-tertiary">Compétences acquises</span>
                    <span className="tabular text-foreground">{skillCount}</span>
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer — présents */}
      <footer className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="label-grimoire">Présents</span>
          <span className="tabular text-xs text-foreground">
            <span className="text-endu">{presentCount}</span>
            <span className="text-ink-tertiary"> / {characters.length}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

function PreviewStat({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-2.5">
      <span className="label-grimoire">{label}</span>
      <span className="tabular text-sm text-foreground">
        <span className={tone}>{value}</span>
        <span className="text-ink-tertiary">/{max}</span>
      </span>
    </div>
  );
}

/* ============================================================
 * MJCharacterClient — fiche complète + feedback toasts.
 * Les signatures de CharacterSheet restent intactes.
 * ============================================================ */
export function MJCharacterClient({
  character,
  isMJ = true,
}: {
  character: Character;
  isMJ?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  return (
    <div className="flex flex-col gap-3">
      {isMJ && (
        <div className="flex justify-end">
          <ModificationsPanel character={character} />
        </div>
      )}
      <CharacterSheet
        character={character}
        isMJ={isMJ}
      onSkillChange={async (skillName, delta) => {
        await updateSkill(character.id, skillName, delta);
        toast.success(
          delta > 0 ? `${skillName} +1` : `${skillName} −1`,
        );
        refresh();
      }}
      onVitalChange={async (type, delta) => {
        await updateVital(character.id, type, delta);
        refresh();
      }}
      onActionCost={async (actionType) => {
        await applyEnduranceAction(character.id, actionType);
        refresh();
      }}
      onXpChange={async (newXp) => {
        await updateXp(character.id, newXp);
        toast.success("XP mise à jour", { description: `${newXp} XP` });
        refresh();
      }}
      onTrainingChange={async (delta) => {
        await updateTrainings(character.id, delta);
        toast.success(
          delta > 0 ? "Entraînement +1" : "Entraînement −1",
        );
        refresh();
      }}
      onFateChange={async (value) => {
        await updateFatePoints(character.id, value);
        refresh();
      }}
      onRuneChange={async (index, value) => {
        const next = [...character.runes];
        next[index] = value;
        await updateRunes(character.id, next);
        refresh();
      }}
      onProfileChange={async (patch: ProfilePatch) => {
        await updateProfile(character.id, patch);
        toast.success("Profil enregistré");
        refresh();
      }}
      onRecoverHp={async () => {
        const res = await recoverHp(character.id);
        if (!res.ok) {
          toast.error(res.reason);
          throw new Error(res.reason);
        }
        refresh();
        const { gain, d1, d2, ecaille, newHp, maxHp } = res;
        toast.success(`+${gain} PV`, { description: `${newHp} / ${maxHp}` });
        return { gain, d1, d2, ecaille, newHp, maxHp };
      }}
      onRecoverEndurance={async () => {
        const res = await recoverEndurance(character.id);
        if (!res.ok) {
          toast.error(res.reason);
          throw new Error(res.reason);
        }
        refresh();
        const { gain, roll, newEndurance, maxEndurance } = res;
        toast.success(`+${gain} END`, {
          description: `${newEndurance} / ${maxEndurance}`,
        });
        return { gain, roll, newEndurance, maxEndurance };
      }}
      onTogglePresence={async () => {
        await togglePresence(character.id);
        toast(character.isPresent ? "Marqué absent" : "Marqué présent");
        refresh();
      }}
      onRollSkill={async ({ attrName, skillName, dd }) => {
        await rollSkillWithDD({
          characterId: character.id,
          attrName,
          skillName: skillName ?? null,
          dd,
        });
        refresh();
      }}
      onFluxChange={async (delta) => {
        await updateFlux(character.id, delta);
        refresh();
      }}
      onFluxTrainingChange={async (delta) => {
        const res = await updateFluxTrainings(character.id, delta);
        if (!res.ok) {
          toast.error(res.reason);
          throw new Error(res.reason);
        }
        if (res.palierChanged) {
          toast.success(`Nouveau palier de Flux — ${res.palierLabel}`, {
            description: `Flux max ${res.max}`,
          });
        } else {
          toast.success(
            delta > 0 ? "Entraînement de Flux +1" : "Entraînement de Flux −1",
          );
        }
        refresh();
      }}
      onCombatChange={async (delta) => {
        const res = await updateCombats(character.id, delta);
        if (!res.ok) {
          toast.error(res.reason);
          throw new Error(res.reason);
        }
        if (res.palierChanged) {
          toast.success(`Nouveau palier de Flux — ${res.palierLabel}`, {
            description: `Flux max ${res.max}`,
          });
        } else {
          toast.success(delta > 0 ? "Combat réel +1" : "Combat réel −1");
        }
        refresh();
      }}
      onTechnicalChange={async (delta) => {
        const res = await updateTechnicalTrainings(character.id, delta);
        if (!res.ok) {
          toast.error(res.reason);
          throw new Error(res.reason);
        }
        if (res.palierChanged) {
          toast.success(`Nouveau palier technique — ${res.palierLabel}`);
        } else {
          toast.success(
            delta > 0 ? "Entraînement technique +1" : "Entraînement technique −1",
          );
        }
        refresh();
      }}
      onAddRune={async (input) => {
        const res = await addRune(character.id, input);
        if (!res.ok) {
          toast.error(res.reason);
          throw new Error(res.reason);
        }
        toast.success("Rune ajoutée");
        refresh();
      }}
      onRemoveRune={async (runeId) => {
        const res = await removeRune(character.id, runeId);
        if (!res.ok) {
          toast.error(res.reason);
          throw new Error(res.reason);
        }
        toast("Rune retirée");
        refresh();
      }}
      onUpdateRune={async (runeId, patch) => {
        await updateRune(character.id, runeId, patch);
        refresh();
      }}
      onUpdateLightCrystals={async (newCount) => {
        await updateLightCrystals(character.id, newCount);
        refresh();
      }}
      onAddCompetenceAlea={async (input) => {
        const res = await addCompetenceAlea(character.id, input);
        if (!res.ok) {
          toast.error(res.reason);
          throw new Error(res.reason);
        }
        toast.success(`Compétence « ${input.name} »`);
        refresh();
      }}
      onRemoveCompetenceAlea={async (competenceId) => {
        await removeCompetenceAlea(character.id, competenceId);
        refresh();
      }}
      onCombatStatChange={async (key, delta) => {
        const res = await updateCombatStats(character.id, {
          [key]: character[key] + delta,
        });
        if (!res.ok) {
          toast.error(res.reason);
          throw new Error(res.reason);
        }
        refresh();
      }}
      onAddCondition={async (input) => {
        const res = await addCondition(character.id, input);
        if (!res.ok) {
          toast.error(res.reason);
          throw new Error(res.reason);
        }
        toast.success(`Condition « ${input.label} »`);
        refresh();
      }}
      onRemoveCondition={async (conditionId) => {
        const res = await removeCondition(conditionId);
        if (!res.ok) {
          toast.error(res.reason);
          throw new Error(res.reason);
        }
        refresh();
      }}
      onAddItem={async (input) => {
        const res = await addItem(character.id, input);
        if (!res.ok) {
          toast.error(res.reason);
          throw new Error(res.reason);
        }
        toast.success(`Objet « ${input.name} »`);
        refresh();
      }}
      onRemoveItem={async (itemId) => {
        await removeItem(character.id, itemId);
        refresh();
      }}
      onToggleEquip={async (itemId) => {
        await toggleEquip(character.id, itemId);
        refresh();
      }}
      onUpdateItemQty={async (itemId, delta) => {
        await updateItemQty(character.id, itemId, delta);
        refresh();
      }}
      />
    </div>
  );
}

/* ============================================================
 * MJQuickRoll — pane droit du cockpit : Jet Rapide branché sur le moteur
 * réel (rollPublicPool → persiste dans public_roll, visible sur /plateau).
 * ============================================================ */
export function MJQuickRoll({
  characterId,
  characterName,
}: {
  characterId: string;
  characterName: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <QuickRollPanel
      characterName={characterName}
      onRoll={async (input) => {
        const res = await rollPublicPool({ characterId, ...input });
        if (!res.ok) {
          toast.error(res.reason);
          return null;
        }
        toast.success(`Jet : ${res.total}`, {
          description: res.isCritSucc
            ? "Réussite critique !"
            : res.isCritFail
              ? "Échec critique"
              : undefined,
        });
        startTransition(() => router.refresh());
        return {
          total: res.total,
          isCritSucc: res.isCritSucc,
          isCritFail: res.isCritFail,
        };
      }}
    />
  );
}

/* ============================================================
 * PendingTrainingPanel — file d'approbation en Card, Empty si vide.
 * ============================================================ */
export function PendingTrainingPanel({
  requests,
}: {
  requests: TrainingRequestWithChar[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  const handleApprove = (id: string) =>
    startTransition(async () => {
      const res = await approveTraining(id);
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      toast.success("Entraînement approuvé (+1)", {
        description: res.tierChanged
          ? `Nouveau palier — ${res.newLabel} (END max ${res.newMax})`
          : `${res.trainings} entraînement${res.trainings > 1 ? "s" : ""}`,
      });
      refresh();
    });

  const handleReject = (id: string) =>
    startTransition(async () => {
      const res = await rejectTraining(id);
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      toast("Demande refusée");
      refresh();
    });

  return (
    <Card className="h-full gap-0 py-0">
      <CardHeader className="flex items-center justify-between gap-4 border-b border-border py-4">
        <div className="min-w-0">
          <p className="label-grimoire">Entraînements en attente</p>
          <CardTitle className="mt-0.5">File d&apos;approbation</CardTitle>
        </div>
        <Badge
          variant={requests.length > 0 ? "default" : "outline"}
          className="tabular shrink-0"
        >
          {requests.length}
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        {requests.length === 0 ? (
          <Empty className="border-0 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>File vide</EmptyTitle>
              <EmptyDescription>
                Aucune demande d&apos;entraînement en attente.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="list-portfolio" aria-label="Demandes d'entraînement">
            {requests.map((r) => (
              <li key={r.id} className="!py-3 !px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-2 text-sm font-medium tracking-tight text-foreground">
                      <span>{r.characterName}</span>
                      {r.requesterName && (
                        <span className="text-xs font-normal text-ink-tertiary">
                          par{" "}
                          <span className="text-muted-foreground">
                            {r.requesterName}
                          </span>
                        </span>
                      )}
                    </p>
                    {r.note && (
                      <p className="mt-1 truncate text-xs italic text-muted-foreground">
                        «&nbsp;{r.note}&nbsp;»
                      </p>
                    )}
                    <p className="tabular mt-1 text-3xs text-ink-tertiary">
                      {new Date(r.requestedAt).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleApprove(r.id)}
                    >
                      Approuver +1
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleReject(r.id)}
                    >
                      Refuser
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
