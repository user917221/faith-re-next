"use client";

import { useState, useTransition } from "react";
import {
  SKILL_GROUPS,
  calculateAttribute,
  countAllocatedPoints,
  type AttributeName,
} from "@/lib/skills";
import { SKILL_CAP, calculateLevel } from "@/lib/faith-system";
import { GrimoireGlyph } from "@/components/glyphs";
import { initialsOf, avatarFallbackStyle } from "@/lib/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VitalsHeader } from "./VitalsHeader";
import { FluxBar } from "./FluxBar";
import { RuneInventory } from "./RuneInventory";
import { EnduranceActionPanel } from "./EnduranceActionPanel";
import { PointAllocatorBar } from "./PointAllocatorBar";
import { SkillRow } from "./SkillRow";
import { EvolutionSection } from "./EvolutionSection";
import { ProfileEditor } from "./ProfileEditor";
import { TrainingRequestButton } from "./TrainingRequestButton";
import { PresenceBadge } from "./PresenceBadge";
import { RecoveryPanel } from "./RecoveryPanel";
import { DDDrawer, type RollContext } from "./DDDrawer";
import type { CharacterSheetProps } from "./types";

type DrawerCtx = RollContext & {
  attrName: AttributeName;
  skillName: string | null;
};

/* Eyebrow de section — Linear : uppercase, tracking +, ink-subtle, hairline accolé */
function SectionLabel({
  children,
  trailing,
}: {
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {children}
      </span>
      {trailing}
    </div>
  );
}

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

  const [drawerCtx, setDrawerCtx] = useState<DrawerCtx | null>(null);
  const openRollDrawer = onRollSkill
    ? (ctx: DrawerCtx) => setDrawerCtx(ctx)
    : undefined;

  const attributes = Object.keys(SKILL_GROUPS) as AttributeName[];

  return (
    <div className="relative z-[2] flex flex-col gap-6">
      {/* ─── Identité — bandeau header dense ─── */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-14">
            <AvatarImage src={character.avatarUrl ?? undefined} alt="" />
            <AvatarFallback
              className="text-base font-medium"
              style={avatarFallbackStyle(character.name)}
            >
              {initialsOf(character.name, character.nom)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold leading-none tracking-tight text-foreground sm:text-3xl">
                {character.name}
              </h1>
              <Badge variant="outline" className="font-normal">
                {isMJ ? "MJ" : "Joueur"}
              </Badge>
              <Badge
                variant="secondary"
                className="tabular font-normal tracking-tight"
              >
                {character.tier}
              </Badge>
              <Badge
                variant="outline"
                className="font-normal tracking-tight text-ink-muted"
              >
                Flux {character.fluxLabel}
              </Badge>
            </div>
            {character.nom && (
              <p className="text-sm text-muted-foreground">{character.nom}</p>
            )}
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.06em] text-ink-tertiary">
              {isMJ && (
                <>
                  <span>
                    Niv.{" "}
                    <span className="tabular text-muted-foreground">
                      {derivedLevel}
                    </span>
                  </span>
                  <span aria-hidden>·</span>
                </>
              )}
              <span>
                <span className="tabular text-muted-foreground">
                  {character.age || "?"}
                </span>{" "}
                ans
              </span>
            </p>
          </div>
        </div>

        {/* Présence — chip aligné à droite */}
        {onTogglePresence && (
          <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                character.isPresent ? "presence-led-on" : "presence-led-off"
              }`}
              aria-hidden
            />
            <span
              className={`text-xs uppercase tracking-[0.08em] ${
                character.isPresent ? "text-endu" : "text-ink-tertiary"
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
      </header>

      {/* ─── Onglets de la fiche ─── */}
      <Tabs defaultValue="vitaux" className="gap-6">
        <TabsList className="sticky top-0 z-10 w-full justify-start">
          <TabsTrigger value="vitaux">Vitaux</TabsTrigger>
          <TabsTrigger value="competences">Compétences</TabsTrigger>
          {isMJ && <TabsTrigger value="evolution">Évolution</TabsTrigger>}
          <TabsTrigger value="profil">Profil</TabsTrigger>
        </TabsList>

        {/* ─── Vitaux + actions ─── colonnes denses ─── */}
        <TabsContent value="vitaux">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            {/* Trio vitaux + Flux (4e jauge) */}
            <div className="flex flex-col gap-4 xl:col-span-7">
              <VitalsHeader
                character={character}
                onVitalChange={onVitalChange}
              />
              <FluxBar
                current={character.currentFlux}
                max={character.maxFlux}
                palier={character.fluxPalier}
                palierLabel={character.fluxLabel}
                onAdjust={onFluxChange}
              />
            </div>

            {/* Récup + actions endurance, empilés */}
            <div className="flex flex-col gap-4 xl:col-span-5">
              {(onRecoverHp || onRecoverEndurance) && (
                <RecoveryPanel
                  onRecoverHp={onRecoverHp}
                  onRecoverEndurance={onRecoverEndurance}
                />
              )}
              <EnduranceActionPanel onActionCost={onActionCost} />
            </div>
          </div>
        </TabsContent>

        {/* ─── Attributs & compétences ─── */}
        <TabsContent value="competences">
          <SectionLabel
            trailing={
              <span className="tabular text-xs text-ink-tertiary">
                {allocated}/{SKILL_CAP} pts
              </span>
            }
          >
            Attributs &amp; compétences
          </SectionLabel>

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
                <Card
                  key={attr}
                  className="border border-border ring-0 transition-colors hover:border-hairline-strong"
                >
                  <CardContent className="flex flex-col gap-4">
                    <header className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-3xs font-medium uppercase tracking-[0.08em] text-ink-tertiary">
                          Attribut
                        </span>
                        <span className="text-lg font-semibold tracking-tight text-foreground">
                          {attr}
                        </span>
                      </div>
                      {openAttrRoll ? (
                        <button
                          type="button"
                          onClick={openAttrRoll}
                          title={`Lancer un jet d'attribut ${attr}`}
                          aria-label={`Lancer un jet d'attribut ${attr}`}
                          className="focus-grimoire group flex flex-col items-end rounded-md transition-colors"
                        >
                          <span
                            className="big-number text-foreground transition-colors group-hover:text-primary-hover"
                            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
                          >
                            {score}
                          </span>
                          <span className="text-3xs uppercase tracking-[0.08em] text-ink-tertiary transition-colors group-hover:text-muted-foreground">
                            Jet
                          </span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span
                            className="big-number text-foreground"
                            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
                          >
                            {score}
                          </span>
                          <span className="text-3xs uppercase tracking-[0.08em] text-ink-tertiary">
                            Score
                          </span>
                        </div>
                      )}
                    </header>
                    <Separator />
                    <div className="flex flex-col gap-2.5">
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
                  </CardContent>
                </Card>
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

        {/* ─── Profil — édition perso + présence + entraînement (joueur) ─── */}
        <TabsContent value="profil">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="flex flex-col gap-4 xl:col-span-7">
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
                <Card className="relative overflow-hidden border border-border ring-0">
                  <span className="pointer-events-none absolute right-3 top-3 text-ink-tertiary/40">
                    <GrimoireGlyph size={64} />
                  </span>
                  <CardContent className="relative z-[1]">
                    <TrainingRequestButton
                      pending={pendingTraining ?? null}
                      onRequestTraining={onRequestTraining}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {onTogglePresence && (
              <div className="xl:col-span-5">
                <PresenceBadge
                  isPresent={character.isPresent}
                  onToggle={onTogglePresence}
                />
              </div>
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
