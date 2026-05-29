"use client";

import { useState } from "react";
import {
  SKILL_GROUPS,
  calculateAttribute,
  countAllocatedPoints,
  type AttributeName,
} from "@/lib/skills";
import { SKILL_CAP, calculateLevel } from "@/lib/faith-system";
import {
  CrestGlyph,
  GrimoireGlyph,
} from "@/components/glyphs";
import { VitalsHeader } from "./VitalsHeader";
import { EnduranceActionPanel } from "./EnduranceActionPanel";
import { PointAllocatorBar } from "./PointAllocatorBar";
import { SkillRow } from "./SkillRow";
import { EvolutionSection } from "./EvolutionSection";
import { ProfileEditor } from "./ProfileEditor";
import { TrainingRequestButton } from "./TrainingRequestButton";
import { RecoveryPanel } from "./RecoveryPanel";
import { DDDrawer, type RollContext } from "./DDDrawer";
import type { CharacterSheetProps } from "./types";

type DrawerCtx = RollContext & {
  attrName: AttributeName;
  skillName: string | null;
};

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
}: CharacterSheetProps) {
  const allocated = countAllocatedPoints(character.skills);
  const isCapped = allocated >= SKILL_CAP;
  const derivedLevel = calculateLevel(character.xp);

  const [drawerCtx, setDrawerCtx] = useState<DrawerCtx | null>(null);
  const openRollDrawer = onRollSkill
    ? (ctx: DrawerCtx) => setDrawerCtx(ctx)
    : undefined;

  const attributes = Object.keys(SKILL_GROUPS) as AttributeName[];
  const initials = `${character.name?.[0] ?? "?"}${character.nom?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="relative z-[2] grid grid-cols-12 gap-4">
      {/* ─── ROW 1 ─── Identite (5) + Vitaux trio (7) ─── */}

      {/* Identité — card-hero col-span-5 */}
      <section className="card-hero col-span-12 lg:col-span-5">
        <div className="flex h-full flex-col gap-5">
          <header className="flex items-start gap-4">
            <span className="shrink-0 text-gold-aged">
              <CrestGlyph size={80} initials={initials} />
            </span>
            <div className="flex flex-col gap-1">
              <span className="label-grimoire">Personnage</span>
              <h1 className="font-display text-5xl font-bold leading-none tracking-[0.02em] text-gold-aged">
                {character.name}
              </h1>
              {character.nom && (
                <p className="font-display mt-1 text-base text-parchment-dim tracking-wide">
                  {character.nom}
                </p>
              )}
              <p className="mt-2 font-display text-[0.72rem] uppercase tracking-[0.16em] text-parchment-mute">
                {isMJ && (
                  <>
                    Niv. <span className="tabular text-parchment-dim">{derivedLevel}</span>
                    {" · "}
                  </>
                )}
                <span className="tabular">{character.age || "?"}</span> ans
              </p>
            </div>
          </header>

          {/* Présence + bouton rejoindre/quitter */}
          {onTogglePresence && (
            <div className="mt-auto flex items-center justify-between gap-3 rounded-[--radius-sm] border border-gold-aged/12 bg-ink-deep/60 px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    character.isPresent ? "presence-led-on" : "presence-led-off"
                  }`}
                  aria-hidden
                />
                <span
                  className={`font-display text-[0.7rem] uppercase tracking-[0.18em] ${
                    character.isPresent ? "text-celadon" : "text-parchment-dim"
                  }`}
                >
                  {character.isPresent ? "À la table" : "Absent"}
                </span>
              </div>
              <PresenceToggle
                isPresent={character.isPresent}
                onToggle={onTogglePresence}
              />
            </div>
          )}
        </div>
      </section>

      {/* Vitaux trio — col-span-7 — 3 cards verticales */}
      <section className="col-span-12 lg:col-span-7">
        <VitalsHeader character={character} onVitalChange={onVitalChange} />
      </section>

      {/* ─── ROW 2 ─── Récup (5) + Endurance Actions (7) ─── */}

      {/* Récup HP + Endu — col-span-5 */}
      {(onRecoverHp || onRecoverEndurance) && (
        <section className="col-span-12 lg:col-span-5">
          <RecoveryPanel
            onRecoverHp={onRecoverHp}
            onRecoverEndurance={onRecoverEndurance}
          />
        </section>
      )}

      {/* Endurance Actions — col-span-7 (ou 12 si pas de recup) */}
      <section
        className={
          onRecoverHp || onRecoverEndurance
            ? "col-span-12 lg:col-span-7"
            : "col-span-12"
        }
      >
        <EnduranceActionPanel onActionCost={onActionCost} />
      </section>

      {/* ─── ROW 3 ─── Allocation (12) ─── */}
      <section className="col-span-12">
        <PointAllocatorBar allocated={allocated} />
      </section>

      {/* ─── ROW 4 ─── Attributs grid 4 bento (12) ─── */}
      <section className="col-span-12">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="label-grimoire">⚜ Attributs &amp; compétences</span>
          <span className="font-display tabular text-[0.65rem] uppercase tracking-[0.16em] text-parchment-mute">
            {allocated}/{SKILL_CAP} pts
          </span>
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
              <div
                key={attr}
                className="card-grimoire transition-all hover:-translate-y-px hover:border-gold-aged/35"
              >
                <header className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-parchment-mute">
                      Attribut
                    </span>
                    <span className="font-display text-2xl font-medium uppercase tracking-[0.12em] text-gold-aged">
                      {attr}
                    </span>
                  </div>
                  {openAttrRoll ? (
                    <button
                      type="button"
                      onClick={openAttrRoll}
                      title={`Lancer un jet d'attribut ${attr}`}
                      aria-label={`Lancer un jet d'attribut ${attr}`}
                      className="focus-grimoire flex flex-col items-end transition-colors hover:text-gold-bright"
                    >
                      <span
                        className="big-number text-gold-aged"
                        style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)" }}
                      >
                        {score}
                      </span>
                      <span className="font-display text-[0.6rem] uppercase tracking-[0.16em] text-parchment-mute">
                        Jet
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span
                        className="big-number text-gold-aged"
                        style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)" }}
                      >
                        {score}
                      </span>
                      <span className="font-display text-[0.6rem] uppercase tracking-[0.16em] text-parchment-mute">
                        Score
                      </span>
                    </div>
                  )}
                </header>
                <div className="flex flex-col gap-2.5 border-t border-gold-aged/10 pt-3">
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
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── ROW 5 ─── Evolution (7) + Profil (5)  OU  Training (7) + Profil (5) ─── */}

      {isMJ && (
        <section className="col-span-12 lg:col-span-7">
          <EvolutionSection
            character={character}
            onXpChange={onXpChange}
            onTrainingChange={onTrainingChange}
          />
        </section>
      )}

      {!isMJ && onRequestTraining && (
        <section className="col-span-12 lg:col-span-7">
          <div className="card-grimoire relative overflow-hidden">
            <div className="pointer-events-none absolute right-3 top-3 text-gold-soft opacity-[0.16]">
              <GrimoireGlyph size={72} />
            </div>
            <div className="relative z-[1]">
              <TrainingRequestButton
                pending={pendingTraining ?? null}
                onRequestTraining={onRequestTraining}
              />
            </div>
          </div>
        </section>
      )}

      {/* Profil col-span-5 */}
      <section className="col-span-12 lg:col-span-5">
        <ProfileEditor
          character={character}
          onProfileChange={onProfileChange}
        />
      </section>

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

/* Petit toggle de présence inline pour la card-hero */
function PresenceToggle({
  isPresent,
  onToggle,
}: {
  isPresent: boolean;
  onToggle: () => Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle()}
      className={
        isPresent
          ? "font-display rounded-[--radius-sm] border border-gold-aged/20 px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.16em] text-parchment-dim transition-colors hover:border-gold-aged/40 hover:text-gold-aged"
          : "btn-grimoire !py-1.5 !px-3 !text-[0.62rem]"
      }
    >
      {isPresent ? "Quitter" : "Rejoindre"}
    </button>
  );
}
