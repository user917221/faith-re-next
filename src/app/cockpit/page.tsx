"use client";

/**
 * /cockpit — APERÇU PUBLIC du cockpit MJ (mock data, sans auth).
 * Banc d'essai visuel : consomme le MÊME <CockpitShell> que /mj, avec un roster
 * et une fiche mock interactifs.
 */

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import CharacterSheet from "@/components/character-sheet";
import type {
  Character,
  CombatStatKey,
  ConditionItem,
  ConditionKind,
  ItemEntry,
  ItemKind,
  RuneItem,
  RuneRarity,
  VitalType,
} from "@/components/character-sheet/types";
import { ALL_SKILLS } from "@/lib/skills";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { avatarFallbackStyle, initialsOf } from "@/lib/avatar";
import { CockpitShell } from "@/components/cockpit/CockpitShell";
import { QuickRollPanel } from "@/components/cockpit/QuickRollPanel";
import { ModificationsPanel } from "@/components/cockpit/ModificationsPanel";
import { JournalView } from "@/components/cockpit/JournalView";
import { NpcsView } from "@/components/cockpit/NpcsView";
import { RulesView } from "@/components/cockpit/RulesView";

const MOCK_JOURNAL = [
  {
    id: "j1",
    title: "L'embuscade au col de Givre",
    body: "La compagnie tombe sur une patrouille hostile. Seraphina tisse un mur de brume ; Darius tient la ligne. Butin : une carte ancienne.",
    sessionNumber: 14,
    createdAt: new Date("2025-04-26T20:00:00"),
  },
  {
    id: "j2",
    title: "Le pacte du marchand",
    body: "Négociation tendue avec Orin le Borgne. Accord conclu, mais une dette plane.",
    sessionNumber: 13,
    createdAt: new Date("2025-04-12T20:00:00"),
  },
];

const MOCK_NPCS = [
  { id: "n1", name: "Orin le Borgne", role: "Marchand d'reliques", disposition: "neutre" as const, description: "Connaît tout le monde, ne fait confiance à personne." },
  { id: "n2", name: "Dame Sève", role: "Gardienne du Bosquet", disposition: "allie" as const, description: "Alliée de Seraphina depuis l'Académie." },
  { id: "n3", name: "Le Cendreux", role: "Chef de meute", disposition: "hostile" as const, description: "Traque la compagnie depuis le col." },
];

const SKILLS: Record<string, number> = Object.fromEntries(
  ALL_SKILLS.map((s) => [s, 1]),
);
// Variété de paliers pour l'aperçu (Novice/Confirmé/Expert/Maître).
Object.assign(SKILLS, {
  Encyclopédie: 6,
  Logique: 4,
  Rhétorique: 3,
  "Sang-Froid": 7,
  Empathie: 4,
  Autorité: 2,
  Résilience: 3,
  Volonté: 5,
  Puissance: 4,
  "Vitesse de Réaction": 2,
});

function mk(id: string, name: string, hp: number, maxHp: number): Character {
  return {
    id,
    name,
    nom: "",
    age: 25,
    xp: 2500,
    level: 3,
    enduranceTrainings: 5,
    currentHp: hp,
    currentMental: Math.round(maxHp * 0.8),
    currentEndurance: 750,
    maxHp,
    maxMental: maxHp,
    maxEndurance: 750,
    maxHpOverride: null,
    maxMentalOverride: null,
    maxEnduranceOverride: null,
    maxFluxOverride: null,
    fatePoints: 2,
    runes: ["", "", ""],
    skills: SKILLS,
    isPresent: true,
    avatarUrl: null,
    fluxTrainings: 5,
    technicalTrainings: 3,
    combatsReal: 3,
    currentFlux: 600,
    maxFlux: 750,
    fluxPalier: 2,
    fluxLabel: "P2",
    technicalPalier: 1,
    technicalLabel: "Initié",
    tier: "T1",
    initiative: 3,
    armor: 2,
    movement: 4,
    proficiency: 2,
    race: null,
    pronouns: null,
    charClass: null,
    bio: null,
    notes: null,
    conditions: [],
    items: [],
    runesInventory: [],
    lightCrystals: 0,
    competencesAlea: [],
  };
}

const INITIAL: Character[] = [
  {
    ...mk("c1", "Seraphina", 42, 42),
    race: "Sylvenne",
    pronouns: "elle/elle",
    charClass: "Tisseuse de Flux",
    bio: "Ancienne archiviste du Bastion, partie sur les routes après la chute.",
    initiative: 5,
    armor: 1,
    conditions: [
      { id: "x1", label: "Concentrée", kind: "focus", diceModifier: 0 },
      { id: "x2", label: "Bénédiction", kind: "buff", diceModifier: 2 },
    ],
    items: [
      { id: "i1", name: "Lame de brume", type: "arme", qty: 1, equipped: true, description: "1d8 tranchant, ignore 1 d'armure." },
      { id: "i2", name: "Cotte tissée", type: "armure", qty: 1, equipped: true, description: null },
      { id: "i3", name: "Fiole de Flux", type: "consommable", qty: 3, equipped: false, description: "Restaure 20 de Flux." },
      { id: "i4", name: "Corde de soie", type: "objet", qty: 1, equipped: false, description: null },
    ],
    runesInventory: [
      { id: "r1", name: "Lame de brume", type: "armement", description: "Tranchant spectral.", level: 4, rarity: "legendaire", damage: "1d8+2", armor: 2, qty: 1 },
      { id: "r2", name: "Voile de Flux", type: "utilitaire", description: "Dissimule la porteuse.", level: 2, rarity: "rare", damage: null, armor: 0, qty: 1 },
      { id: "r3", name: "Sceau d'ancrage", type: "predefinie", description: null, level: 1, rarity: "commune", damage: null, armor: 0, qty: 1 },
    ],
    lightCrystals: 4,
    competencesAlea: [
      { id: "ca1", name: "Danse du Sort", description: "Bonus +2 en contrôle de Flux." },
    ],
  },
  {
    ...mk("c2", "Darius", 56, 56),
    race: "Humain",
    charClass: "Garde du Serment",
    armor: 6,
    initiative: 1,
    conditions: [{ id: "x3", label: "Saignement", kind: "wound", diceModifier: -1 }],
  },
  mk("c3", "Mira", 38, 38),
  {
    ...mk("c4", "Joric", 29, 36),
    conditions: [{ id: "x4", label: "Étourdi", kind: "debuff", diceModifier: -2 }],
  },
  mk("c5", "Elowen", 31, 31),
  mk("c6", "Calder", 27, 27),
];

export default function CockpitPreview() {
  return (
    <Suspense fallback={null}>
      <CockpitInner />
    </Suspense>
  );
}

function CockpitInner() {
  const sp = useSearchParams();
  const view = sp.get("view") ?? "dashboard";
  const playerView = sp.get("mode") === "player";
  const [chars, setChars] = useState<Character[]>(INITIAL);
  const [selId, setSelId] = useState("c1");
  const selected = chars.find((c) => c.id === selId) ?? chars[0];

  const patch = useCallback(
    (id: string, fn: (c: Character) => Character) =>
      setChars((cs) => cs.map((c) => (c.id === id ? fn(c) : c))),
    [],
  );

  const onVitalChange = useCallback(
    async (type: VitalType, delta: number) => {
      patch(selId, (c) => {
        if (type === "hp")
          return { ...c, currentHp: Math.max(-21, Math.min(c.maxHp, c.currentHp + delta)) };
        if (type === "mental")
          return {
            ...c,
            currentMental: Math.max(0, Math.min(c.maxMental, c.currentMental + delta)),
          };
        return {
          ...c,
          currentEndurance: Math.max(0, Math.min(c.maxEndurance, c.currentEndurance + delta)),
        };
      });
    },
    [patch, selId],
  );

  const onSkillChange = useCallback(
    async (skillName: string, delta: 1 | -1) => {
      patch(selId, (c) => ({
        ...c,
        skills: { ...c.skills, [skillName]: Math.max(0, (c.skills[skillName] ?? 0) + delta) },
      }));
    },
    [patch, selId],
  );

  const onFluxChange = useCallback(
    async (delta: number) => {
      patch(selId, (c) => ({
        ...c,
        currentFlux: Math.max(0, Math.min(c.maxFlux, c.currentFlux + delta)),
      }));
    },
    [patch, selId],
  );

  const onCombatStatChange = useCallback(
    async (key: CombatStatKey, delta: number) => {
      patch(selId, (c) => ({ ...c, [key]: Math.max(0, c[key] + delta) }));
    },
    [patch, selId],
  );

  const onAddCondition = useCallback(
    async (input: { label: string; kind: ConditionKind; diceModifier?: number }) => {
      const next: ConditionItem = {
        id: `cond-${Math.round(performance.now())}`,
        label: input.label,
        kind: input.kind,
        diceModifier: input.diceModifier ?? 0,
      };
      patch(selId, (c) => ({ ...c, conditions: [...c.conditions, next] }));
    },
    [patch, selId],
  );

  const onRemoveCondition = useCallback(
    async (conditionId: string) => {
      patch(selId, (c) => ({
        ...c,
        conditions: c.conditions.filter((x) => x.id !== conditionId),
      }));
    },
    [patch, selId],
  );

  const onAddItem = useCallback(
    async (input: {
      name: string;
      type: ItemKind;
      qty?: number;
      description?: string;
    }) => {
      const next: ItemEntry = {
        id: `item-${Math.round(performance.now())}`,
        name: input.name,
        type: input.type,
        qty: input.qty ?? 1,
        equipped: false,
        description: input.description ?? null,
      };
      patch(selId, (c) => ({ ...c, items: [...c.items, next] }));
    },
    [patch, selId],
  );

  const onRemoveItem = useCallback(
    async (itemId: string) => {
      patch(selId, (c) => ({
        ...c,
        items: c.items.filter((x) => x.id !== itemId),
      }));
    },
    [patch, selId],
  );

  const onToggleEquip = useCallback(
    async (itemId: string) => {
      patch(selId, (c) => ({
        ...c,
        items: c.items.map((x) =>
          x.id === itemId ? { ...x, equipped: !x.equipped } : x,
        ),
      }));
    },
    [patch, selId],
  );

  const onUpdateItemQty = useCallback(
    async (itemId: string, delta: number) => {
      patch(selId, (c) => ({
        ...c,
        items: c.items
          .map((x) => (x.id === itemId ? { ...x, qty: x.qty + delta } : x))
          .filter((x) => x.qty > 0),
      }));
    },
    [patch, selId],
  );

  const onAddRune = useCallback(
    async (input: { name: string; type: RuneItem["type"]; description?: string }) => {
      const next: RuneItem = {
        id: `rune-${Math.round(performance.now())}`,
        name: input.name,
        type: input.type,
        description: input.description ?? null,
        level: 1,
        rarity: "commune",
        damage: null,
        armor: 0,
        qty: 1,
      };
      patch(selId, (c) => ({ ...c, runesInventory: [...c.runesInventory, next] }));
    },
    [patch, selId],
  );

  const onRemoveRune = useCallback(
    async (runeId: string) => {
      patch(selId, (c) => ({
        ...c,
        runesInventory: c.runesInventory.filter((r) => r.id !== runeId),
      }));
    },
    [patch, selId],
  );

  const onUpdateRune = useCallback(
    async (
      runeId: string,
      rp: {
        level?: number;
        rarity?: RuneRarity;
        damage?: string;
        armor?: number;
        qty?: number;
      },
    ) => {
      patch(selId, (c) => ({
        ...c,
        runesInventory: c.runesInventory.map((r) =>
          r.id === runeId
            ? {
                ...r,
                level: rp.level ?? r.level,
                rarity: rp.rarity ?? r.rarity,
                damage: rp.damage !== undefined ? rp.damage || null : r.damage,
                armor: rp.armor ?? r.armor,
                qty: rp.qty ?? r.qty,
              }
            : r,
        ),
      }));
    },
    [patch, selId],
  );

  const onUpdateLightCrystals = useCallback(
    async (newCount: number) => {
      patch(selId, (c) => ({
        ...c,
        lightCrystals: Math.max(0, Math.min(999, newCount)),
      }));
    },
    [patch, selId],
  );

  const onAddCompetenceAlea = useCallback(
    async (input: { name: string; description?: string }) => {
      patch(selId, (c) => ({
        ...c,
        competencesAlea: [
          ...c.competencesAlea,
          {
            id: `ca-${Math.round(performance.now())}`,
            name: input.name,
            description: input.description ?? null,
          },
        ],
      }));
    },
    [patch, selId],
  );

  const onRemoveCompetenceAlea = useCallback(
    async (competenceId: string) => {
      patch(selId, (c) => ({
        ...c,
        competencesAlea: c.competencesAlea.filter((x) => x.id !== competenceId),
      }));
    },
    [patch, selId],
  );

  let center: React.ReactNode;
  if (view === "journal") {
    center = (
      <JournalView campaignId="mock" entries={MOCK_JOURNAL} currentSession={14} canEdit />
    );
  } else if (view === "npcs") {
    center = <NpcsView campaignId="mock" npcs={MOCK_NPCS} canEdit />;
  } else if (view === "regles") {
    center = <RulesView />;
  } else {
    center = (
      <div className="flex flex-col gap-3">
        {!playerView && (
          <div className="flex justify-end">
            <ModificationsPanel character={selected} />
          </div>
        )}
        <CharacterSheet
          character={selected}
          isMJ={!playerView}
          onVitalChange={onVitalChange}
        onSkillChange={onSkillChange}
        onFluxChange={onFluxChange}
        onCombatStatChange={onCombatStatChange}
        onAddCondition={onAddCondition}
        onRemoveCondition={onRemoveCondition}
        onAddRune={onAddRune}
        onRemoveRune={onRemoveRune}
        onUpdateRune={onUpdateRune}
        onUpdateLightCrystals={onUpdateLightCrystals}
        onAddCompetenceAlea={onAddCompetenceAlea}
        onRemoveCompetenceAlea={onRemoveCompetenceAlea}
        />
      </div>
    );
  }

  return (
    <CockpitShell
      user={{ name: "Game Master", role: "mj", image: null }}
      activeView={view}
      playerView={playerView}
      rollPanel={<QuickRollPanel characterName={selected.name} />}
      roster={
        <div className="campaign-panel">
          <div className="campaign-header-line flex items-center justify-between px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
              Roster
            </p>
            <span className="font-mono text-[10px] tabular-nums text-foreground-subtle">
              {chars.length}/{chars.length} présents
            </span>
          </div>
          <div className="flex flex-col">
            {chars.map((c) => {
              const active = c.id === selId;
              const hpPct = Math.max(
                0,
                Math.min(100, (c.currentHp / c.maxHp) * 100),
              );
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelId(c.id)}
                  className={`group flex items-center gap-2.5 border-l-2 px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-l-primary bg-primary/10"
                      : "border-l-transparent hover:bg-surface-overlay/40"
                  }`}
                >
                  <span className="relative shrink-0">
                    <Avatar className="size-8 rounded-md">
                      <AvatarFallback
                        className="rounded-md text-[11px]"
                        style={avatarFallbackStyle(c.name)}
                      >
                        {initialsOf(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      aria-hidden
                      className="presence-led-on absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-card"
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="flex items-center gap-2">
                      <span
                        className={`truncate text-sm font-medium tracking-tight ${
                          active
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
                      <span
                        className={`h-1.5 flex-1 overflow-hidden rounded-full ${
                          c.currentHp < 0 ? "bg-mhp/30" : "bg-surface-overlay"
                        }`}
                      >
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
                              : hpPct < 25
                                ? "text-hp"
                                : "text-foreground-muted"
                          }
                          style={
                            c.currentHp < 0 ? { color: "var(--mhp)" } : undefined
                          }
                        >
                          {c.currentHp}
                        </span>
                        <span className="text-ink-tertiary/60">/{c.maxHp}</span>
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      }
    >
      {center}
    </CockpitShell>
  );
}
