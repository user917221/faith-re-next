"use client";

import { useState, useTransition } from "react";
import {
  SKILL_GROUPS,
  calculateAttribute,
  countAllocatedPoints,
  type AttributeName,
} from "@/lib/skills";
import { getSkillCap, calculateLevel } from "@/lib/faith-system";
import { Brain, Eye, Shield, Crosshair, Dices, Loader2 } from "lucide-react";
import { ConstellationGlyph } from "@/components/glyphs";
import { initialsOf, avatarFallbackStyle } from "@/lib/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { VitalsHeader } from "./VitalsHeader";
import { PaliersRewards } from "./PaliersRewards";
import { XpBar } from "./XpBar";
import { ConditionsPanel } from "./ConditionsPanel";
import { ObjectsTab } from "./ObjectsTab";
import { EnduranceActionPanel } from "./EnduranceActionPanel";
import { PointAllocatorBar } from "./PointAllocatorBar";
import { SkillTierLegend } from "./SkillTierLegend";
import { SkillRow } from "./SkillRow";
import { EvolutionSection } from "./EvolutionSection";
import { ProfileEditor } from "./ProfileEditor";
import { TrainingRequestButton } from "./TrainingRequestButton";
import { RecoveryPanel } from "./RecoveryPanel";
import { DDDrawer, type RollContext } from "./DDDrawer";
import type { CharacterSheetProps } from "./types";

/* Chips d'attributs — 4 attributs FAITH:RE (score = somme des 5 skills). */
const ATTR_CHIPS = [
  { name: "INTELLECT", short: "INT", icon: Brain, accent: "var(--mhp)" },
  { name: "PSYCHÉ", short: "PSY", icon: Eye, accent: "#a78bfa" },
  { name: "CONSTITUTION", short: "CON", icon: Shield, accent: "var(--endu)" },
  { name: "MANŒUVRE", short: "MAN", icon: Crosshair, accent: "var(--primary)" },
] as const;

type DrawerCtx = RollContext & {
  attrName: AttributeName;
  skillName: string | null;
};

type TabValue = "vitaux" | "competences" | "objets" | "evolution" | "profil";

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
  onUpdateRune,
  onUpdateLightCrystals,
  onAddCompetenceAlea,
  onRemoveCompetenceAlea,
  onAddCondition,
  onRemoveCondition,
}: CharacterSheetProps) {
  const allocated = countAllocatedPoints(character.skills);
  const derivedLevel = calculateLevel(character.xp);
  const skillCap = getSkillCap(derivedLevel); // 80 + 1 par niveau
  const isCapped = allocated >= skillCap;

  const [tab, setTab] = useState<TabValue>("vitaux");
  const [drawerCtx, setDrawerCtx] = useState<DrawerCtx | null>(null);
  const openRollDrawer = onRollSkill
    ? (ctx: DrawerCtx) => setDrawerCtx(ctx)
    : undefined;

  const attributes = Object.keys(SKILL_GROUPS) as AttributeName[];

  return (
    <div className="relative z-[2] flex flex-col gap-5">
      {/* ─── Identité — carte header (v0 + glyphe signature) ─── */}
      <header className="campaign-panel p-5 lg:p-6">
        {/* Glyphe signature FAITH:RE — filigrane d'angle (identité, pas déco) */}
        <ConstellationGlyph
          size={148}
          aria-hidden
          className="pointer-events-none absolute -right-9 -top-10 text-primary opacity-[0.08]"
        />

        {/* Ligne identité */}
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
          <div className="relative shrink-0">
            <Avatar className="size-16 rounded-xl ring-1 ring-primary/30 ring-offset-2 ring-offset-card">
              <AvatarImage
                src={character.avatarUrl ?? undefined}
                alt=""
                className="rounded-xl"
              />
              <AvatarFallback
                className="rounded-xl text-base font-semibold"
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

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground lg:text-3xl">
                {character.name}
              </h1>
              <HeaderBadge>{isMJ ? "MJ" : "Joueur"}</HeaderBadge>
              <HeaderBadge>{character.tier}</HeaderBadge>
              <HeaderBadge>Flux {character.fluxLabel}</HeaderBadge>
              {character.charClass && (
                <HeaderBadge accent>{character.charClass}</HeaderBadge>
              )}
            </div>

            <p className="mt-1.5 text-sm text-foreground-muted">
              {character.nom && <span>{character.nom}</span>}
              {character.nom && (
                <span className="mx-2 text-foreground-subtle">·</span>
              )}
              {character.race && (
                <>
                  <span>{character.race}</span>
                  <span className="mx-2 text-foreground-subtle">·</span>
                </>
              )}
              {character.pronouns && (
                <>
                  <span className="font-mono text-xs">{character.pronouns}</span>
                  <span className="mx-2 text-foreground-subtle">·</span>
                </>
              )}
              <span>
                Niv.{" "}
                <span className="font-mono tabular-nums slashed-zero">
                  {derivedLevel}
                </span>
              </span>
              <span className="mx-2 text-foreground-subtle">·</span>
              <span className="font-mono tabular-nums slashed-zero">
                {character.age || "?"}
              </span>{" "}
              ans
            </p>
          </div>

          {/* Présence — chip + toggle (à droite) */}
          {onTogglePresence && (
            <div className="campaign-subpanel flex shrink-0 items-center gap-2.5 self-start px-3 py-2 lg:self-center">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  character.isPresent ? "presence-led-on" : "presence-led-off"
                }`}
                aria-hidden
              />
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
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

        {/* Rangée d'attributs — pied de carte pleine largeur (ledger horizontal) */}
        <div
          className="campaign-subpanel relative mt-5 grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0"
          role="list"
          aria-label="Attributs"
        >
          {ATTR_CHIPS.map(({ name, short, icon: Icon, accent }) => {
            const score = calculateAttribute(character.skills, name);
            return (
              <div
                key={short}
                role="listitem"
                title={name}
                className="group/attr relative flex flex-col items-center justify-center gap-1 px-3 py-3.5"
              >
                {/* liseré d'accent par attribut */}
                <span
                  aria-hidden
                  className="absolute inset-x-3 top-0 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                    opacity: 0.6,
                  }}
                />
                <span className="flex items-center gap-1.5">
                  <Icon size={12} style={{ color: accent }} aria-hidden />
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-subtle">
                    {short}
                  </span>
                </span>
                <span className="font-mono text-lg font-semibold tabular-nums slashed-zero text-foreground">
                  {score}
                </span>
              </div>
            );
          })}
        </div>
      </header>

      {/* ─── Onglets de la fiche — segmented-pills mono (geste Omen) ─── */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabValue)}
        className="gap-5"
      >
        <TabsList
          aria-label="Sections de la fiche"
          // top piloté par chaque coque : 0 dans le cockpit (scroll du pane
          // central), 3.5rem sous la top-bar de l'AppShell (scroll document).
          style={{ top: "var(--sheet-tabs-top, 0px)" }}
          className="sticky z-20 flex w-full h-auto items-center gap-1 rounded-lg border border-border bg-background/95 p-1 backdrop-blur-xl"
        >
          {(
            [
              ["vitaux", "Vitaux"],
              ["competences", "Stats"],
              ["objets", "Objets"],
              ...(isMJ ? [["evolution", "Évolution"]] : []),
              ["profil", "Profil"],
            ] as [TabValue, string][]
          ).map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex-1 whitespace-nowrap rounded-md px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors text-foreground-subtle hover:bg-surface-overlay/60 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-primary/25 shadow-none data-[state=active]:shadow-sm"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── Vitaux + actions ─── stack vertical (flux v0) ─── */}
        <TabsContent value="vitaux">
          <div className="flex flex-col gap-4">
            {/* Barre d'XP — MJ uniquement */}
            {isMJ && <XpBar character={character} />}

            {/* Conditions actives */}
            <ConditionsPanel
              conditions={character.conditions}
              onAddCondition={onAddCondition}
              onRemoveCondition={onRemoveCondition}
            />

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

            {/* Récompenses des paliers — MJ uniquement (les joueurs ne voient
                ni les récompenses ni le « comment atteindre »). */}
            {isMJ && <PaliersRewards character={character} />}
          </div>
        </TabsContent>

        {/* ─── Attributs & compétences ─── cartes de section v0 ─── */}
        <TabsContent value="competences">
          <div className="mb-4 flex flex-col gap-3">
            <PointAllocatorBar allocated={allocated} cap={skillCap} />
            <SkillTierLegend />
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
                <section key={attr} className="campaign-panel">
                  <header className="campaign-header-line flex items-center px-5 py-3">
                    <span className="shrink-0 font-mono text-xs font-medium uppercase tracking-[0.12em] text-foreground-muted">
                      {attr}
                    </span>
                    <span
                      className="mx-2 mb-1.5 min-w-5 flex-1 self-end border-b border-dotted border-white/16"
                      aria-hidden
                    />
                    {openAttrRoll ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={openAttrRoll}
                        title={`Lancer un jet d'attribut ${attr}`}
                        aria-label={`Lancer un jet d'attribut ${attr}`}
                        className="group flex shrink-0 items-center gap-1.5 h-auto px-2 py-1 border border-transparent hover:border-primary/30 hover:bg-primary/10"
                      >
                        <span className="font-mono text-lg font-semibold tabular-nums slashed-zero text-foreground">
                          {score}
                        </span>
                        <Dices
                          size={13}
                          className="text-foreground-subtle transition-colors group-hover/button:text-primary"
                          aria-hidden
                        />
                      </Button>
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

        {/* ─── Objets — Cristaux de Lumière + Runes + Compétences de l'Aléa ─── */}
        <TabsContent value="objets">
          <ObjectsTab
            character={character}
            onAddRune={onAddRune}
            onRemoveRune={onRemoveRune}
            onUpdateRune={onUpdateRune}
            onUpdateLightCrystals={onUpdateLightCrystals}
            onAddCompetenceAlea={onAddCompetenceAlea}
            onRemoveCompetenceAlea={onRemoveCompetenceAlea}
          />
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
      className="inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em]"
      style={
        accent
          ? {
              background: "rgba(196,154,92,0.18)",
              border: "1px solid rgba(196,154,92,0.35)",
              color: "var(--primary-hover)",
            }
          : {
              background: "rgba(255,244,214,0.045)",
              border: "1px solid var(--border)",
              color: "var(--foreground-muted)",
            }
      }
    >
      {children}
    </span>
  );
}

function PresenceToggle({
  isPresent,
  onToggle,
}: {
  isPresent: boolean;
  onToggle: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      disabled={isPending}
      onClick={() => startTransition(() => onToggle())}
      className={
        isPresent
          ? "h-6 rounded-md px-2 text-xs text-ink-tertiary hover:text-foreground hover:bg-transparent"
          : "h-6 rounded-md px-2 text-xs font-medium text-primary hover:text-primary-hover hover:bg-transparent"
      }
    >
      {isPending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : isPresent ? (
        "Quitter"
      ) : (
        "Rejoindre"
      )}
    </Button>
  );
}
