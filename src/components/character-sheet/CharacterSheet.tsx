"use client";

import { useState, useTransition } from "react";
import {
  SKILL_GROUPS,
  calculateAttribute,
  countAllocatedPoints,
  type AttributeName,
} from "@/lib/skills";
import { SKILL_CAP, calculateLevel } from "@/lib/faith-system";
import { Brain, Eye, Shield, Crosshair, Dices } from "lucide-react";
import { initialsOf, avatarFallbackStyle } from "@/lib/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { VitalsHeader } from "./VitalsHeader";
import { RuneInventory } from "./RuneInventory";
import { EnduranceActionPanel } from "./EnduranceActionPanel";
import { PointAllocatorBar } from "./PointAllocatorBar";
import { SkillRow } from "./SkillRow";
import { EvolutionSection } from "./EvolutionSection";
import { ProfileEditor } from "./ProfileEditor";
import { TrainingRequestButton } from "./TrainingRequestButton";
import { RecoveryPanel } from "./RecoveryPanel";
import { DDDrawer, type RollContext } from "./DDDrawer";
import type { CharacterSheetProps } from "./types";

/* Chips d'attributs — 4 attributs FAITH:RE (score = somme des 5 skills). */
const ATTR_CHIPS = [
  { name: "INTELLECT", short: "INT", icon: Brain },
  { name: "PSYCHÉ", short: "PSY", icon: Eye },
  { name: "CONSTITUTION", short: "CON", icon: Shield },
  { name: "MANŒUVRE", short: "MAN", icon: Crosshair },
] as const;

type DrawerCtx = RollContext & {
  attrName: AttributeName;
  skillName: string | null;
};

type TabValue = "vitaux" | "competences" | "evolution" | "profil";

export default function CharacterSheet({
  character,
  isMJ,
  pendingTraining,
  onSkillChange,
  onVitalChange,
  onActionCost,
  onXpChange,
  onTrainingChange,
  onProfileChange,
  onRequestTraining,
  onRecoverHp,
  onRecoverEndurance,
  onTogglePresence,
  onRollSkill,
  onFluxChange,
  onFluxTrainingChange,
  onCombatChange,
  onTechnicalChange,
  onAddRune,
  onRemoveRune,
}: CharacterSheetProps) {
  const allocated = countAllocatedPoints(character.skills);
  const isCapped = allocated >= SKILL_CAP;
  const derivedLevel = calculateLevel(character.xp);

  const [tab, setTab] = useState<TabValue>("vitaux");
  const [drawerCtx, setDrawerCtx] = useState<DrawerCtx | null>(null);
  const openRollDrawer = onRollSkill
    ? (ctx: DrawerCtx) => setDrawerCtx(ctx)
    : undefined;

  const attributes = Object.keys(SKILL_GROUPS) as AttributeName[];

  return (
    <div className="relative z-[2] flex flex-col gap-6">
      {/* ─── Identité — carte header (direction v0) ─── */}
      <header
        className="rounded-xl border border-border p-5"
        style={{
          background:
            "linear-gradient(145deg, rgba(22,24,32,0.98) 0%, rgba(14,15,20,0.99) 100%)",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="size-14 rounded-xl ring-1 ring-[rgba(94,106,210,0.25)]">
              <AvatarImage
                src={character.avatarUrl ?? undefined}
                alt=""
                className="rounded-xl"
              />
              <AvatarFallback
                className="rounded-xl text-sm font-semibold"
                style={avatarFallbackStyle(character.name)}
              >
                {initialsOf(character.name, character.nom)}
              </AvatarFallback>
            </Avatar>
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
              style={{
                background: character.isPresent
                  ? "var(--endu)"
                  : "var(--foreground-subtle)",
                borderColor: "var(--background)",
              }}
              aria-hidden
            />
          </div>

          {/* Nom + badges + sous-ligne + chips d'attributs */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {character.name}
              </h1>
              <HeaderBadge accent>{isMJ ? "MJ" : "Joueur"}</HeaderBadge>
              <HeaderBadge>{character.tier}</HeaderBadge>
              <HeaderBadge>Flux {character.fluxLabel}</HeaderBadge>
            </div>

            <p className="mb-3 text-sm text-foreground-muted">
              {character.nom && <span>{character.nom}</span>}
              {character.nom && (
                <span className="mx-2 text-foreground-subtle">·</span>
              )}
              {isMJ && (
                <>
                  <span>
                    Niv.{" "}
                    <span className="tabular-nums">{derivedLevel}</span>
                  </span>
                  <span className="mx-2 text-foreground-subtle">·</span>
                </>
              )}
              <span className="tabular-nums">{character.age || "?"}</span> ans
            </p>

            <div
              className="flex flex-wrap gap-1.5"
              role="list"
              aria-label="Attributs"
            >
              {ATTR_CHIPS.map(({ name, short, icon: Icon }) => {
                const score = calculateAttribute(character.skills, name);
                return (
                  <div
                    key={short}
                    role="listitem"
                    title={name}
                    className="flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-1"
                  >
                    <Icon
                      size={10}
                      className="text-foreground-subtle"
                      aria-hidden
                    />
                    <span className="text-[10px] uppercase tracking-widest text-foreground-subtle">
                      {short}
                    </span>
                    <span className="font-mono text-xs font-medium tabular-nums text-foreground-muted">
                      {score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Présence — chip + toggle (à droite) */}
          {onTogglePresence && (
            <div className="flex shrink-0 items-center gap-2.5 self-start rounded-md border border-border bg-surface-overlay px-3 py-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  character.isPresent ? "presence-led-on" : "presence-led-off"
                }`}
                aria-hidden
              />
              <span
                className={`text-xs uppercase tracking-[0.08em] ${
                  character.isPresent ? "text-endu" : "text-foreground-subtle"
                }`}
              >
                {character.isPresent ? "À la table" : "Absent"}
              </span>
              <PresenceToggle
                isPresent={character.isPresent}
                onToggle={onTogglePresence}
              />
            </div>
          )}
        </div>
      </header>

      {/* ─── Onglets de la fiche — segmented-pills mono (geste Omen) ─── */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabValue)}
        className="gap-6"
      >
        <div
          role="tablist"
          aria-label="Sections de la fiche"
          className="sticky top-0 z-10 flex w-full items-center gap-1 rounded-full border border-border bg-surface-overlay p-1"
        >
          {(
            [
              ["vitaux", "Vitaux"],
              ["competences", "Compétences"],
              ...(isMJ ? [["evolution", "Évolution"]] : []),
              ["profil", "Profil"],
            ] as [TabValue, string][]
          ).map(([value, label]) => {
            const active = tab === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(value)}
                className={`flex-1 whitespace-nowrap rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground-subtle hover:text-foreground-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ─── Vitaux + actions ─── stack vertical (flux v0) ─── */}
        <TabsContent value="vitaux">
          <div className="flex flex-col gap-4">
            {/* 4 jauges circulaires vitales (Santé / Mental / Endurance / Flux) */}
            <VitalsHeader
              character={character}
              onVitalChange={onVitalChange}
              onFluxChange={onFluxChange}
            />

            {(onRecoverHp || onRecoverEndurance) && (
              <RecoveryPanel
                onRecoverHp={onRecoverHp}
                onRecoverEndurance={onRecoverEndurance}
              />
            )}

            <EnduranceActionPanel onActionCost={onActionCost} />
          </div>
        </TabsContent>

        {/* ─── Attributs & compétences ─── cartes de section v0 ─── */}
        <TabsContent value="competences">
          <div className="mb-4">
            <PointAllocatorBar allocated={allocated} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {attributes.map((attr) => {
              const score = calculateAttribute(character.skills, attr);
              const openAttrRoll = openRollDrawer
                ? () =>
                    openRollDrawer({
                      title: attr,
                      bonus: score,
                      bonusLabel: `${attr} (${score}) seul`,
                      attrName: attr,
                      skillName: null,
                    })
                : null;

              return (
                <section
                  key={attr}
                  className="overflow-hidden rounded-xl border border-border"
                  style={{
                    background: "rgba(17,19,24,0.98)",
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  <header className="flex items-center border-b border-border px-5 py-3">
                    <span className="shrink-0 font-mono text-xs font-medium uppercase tracking-[0.12em] text-foreground-muted">
                      {attr}
                    </span>
                    <span
                      className="mx-2 mb-1.5 min-w-5 flex-1 self-end border-b border-dotted border-white/15"
                      aria-hidden
                    />
                    {openAttrRoll ? (
                      <button
                        type="button"
                        onClick={openAttrRoll}
                        title={`Lancer un jet d'attribut ${attr}`}
                        aria-label={`Lancer un jet d'attribut ${attr}`}
                        className="group flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-surface-overlay"
                      >
                        <span className="font-mono text-lg font-semibold tabular-nums slashed-zero text-foreground">
                          {score}
                        </span>
                        <Dices
                          size={13}
                          className="text-foreground-subtle transition-colors group-hover:text-primary"
                          aria-hidden
                        />
                      </button>
                    ) : (
                      <span className="shrink-0 font-mono text-lg font-semibold tabular-nums slashed-zero text-foreground">
                        {score}
                      </span>
                    )}
                  </header>
                  <div className="divide-y divide-border">
                    {SKILL_GROUPS[attr].map((skill) => (
                      <SkillRow
                        key={skill}
                        name={skill}
                        value={character.skills[skill] ?? 0}
                        attrScore={score}
                        isCapped={isCapped}
                        onSkillChange={onSkillChange}
                        onOpenRollDrawer={openRollDrawer}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── Évolution (MJ seulement) ─── */}
        {isMJ && (
          <TabsContent value="evolution">
            <EvolutionSection
              character={character}
              onXpChange={onXpChange}
              onTrainingChange={onTrainingChange}
              onFluxTrainingChange={onFluxTrainingChange}
              onCombatChange={onCombatChange}
              onTechnicalChange={onTechnicalChange}
            />
          </TabsContent>
        )}

        {/* ─── Profil — édition perso + inventaire + entraînement (joueur) ─── */}
        <TabsContent value="profil">
          <div className="flex flex-col gap-4">
            <ProfileEditor
              character={character}
              onProfileChange={onProfileChange}
            />

            <RuneInventory
              runes={character.runesInventory}
              onAddRune={onAddRune}
              onRemoveRune={onRemoveRune}
            />

            {!isMJ && onRequestTraining && (
              <TrainingRequestButton
                pending={pendingTraining ?? null}
                onRequestTraining={onRequestTraining}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Drawer de jet (rendered once) */}
      {onRollSkill && (
        <DDDrawer
          context={drawerCtx}
          onClose={() => setDrawerCtx(null)}
          onRoll={async (dd) => {
            if (!drawerCtx) return;
            await onRollSkill({
              attrName: drawerCtx.attrName,
              skillName: drawerCtx.skillName,
              dd,
            });
            setDrawerCtx(null);
          }}
        />
      )}
    </div>
  );
}

/* Badge pilule header — variante accent (MJ) ou neutre (direction v0) */
function HeaderBadge({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest"
      style={
        accent
          ? {
              background: "rgba(94,106,210,0.18)",
              border: "1px solid rgba(94,106,210,0.35)",
              color: "#a5abf0",
            }
          : {
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--foreground-muted)",
            }
      }
    >
      {children}
    </span>
  );
}

/* Petit toggle de présence inline — variante texte Linear (lien lavande/ghost) */
function PresenceToggle({
  isPresent,
  onToggle,
}: {
  isPresent: boolean;
  onToggle: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => onToggle())}
      className={
        isPresent
          ? "focus-grimoire rounded-md px-1.5 text-xs text-ink-tertiary transition-colors hover:text-foreground disabled:opacity-40"
          : "focus-grimoire rounded-md px-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover disabled:opacity-40"
      }
    >
      {isPresent ? "Quitter" : "Rejoindre"}
    </button>
  );
}
