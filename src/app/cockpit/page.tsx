"use client";

/**
 * /cockpit — APERÇU PUBLIC du cockpit MJ (Phase 1, mock data).
 * Banc d'essai visuel du layout 3-panneaux (Roster | Fiche | Quick-Roll) + shell
 * enrichi (sidebar nav complète + Campaign Status + Session Timer, top bar GM Mode/
 * session, bottom bar). À intégrer ensuite dans /mj avec les vraies données.
 */

import { useCallback, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BookText,
  Map,
  UserCircle2,
  Package,
  Scale,
  Dices,
  Settings,
  Search,
  Command,
  Crown,
  ChevronDown,
  MonitorPlay,
  Eye,
  FileDown,
} from "lucide-react";
import CharacterSheet from "@/components/character-sheet";
import type {
  Character,
  VitalType,
} from "@/components/character-sheet/types";
import { ALL_SKILLS } from "@/lib/skills";
import { CrestGlyph } from "@/components/glyphs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initialsOf, avatarFallbackStyle } from "@/lib/avatar";
import { CampaignStatus } from "@/components/cockpit/CampaignStatus";
import { SessionTimer } from "@/components/cockpit/SessionTimer";
import { QuickRollPanel } from "@/components/cockpit/QuickRollPanel";

const SKILLS = Object.fromEntries(ALL_SKILLS.map((s) => [s, 1]));

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
    tier: "T3",
    runesInventory: [],
  };
}

const INITIAL: Character[] = [
  mk("c1", "Seraphina", 42, 42),
  mk("c2", "Darius", 56, 56),
  mk("c3", "Mira", 38, 38),
  mk("c4", "Joric", 29, 36),
  mk("c5", "Elowen", 31, 31),
  mk("c6", "Calder", 27, 27),
];

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Roster", icon: Users },
  { label: "Sessions", icon: CalendarDays },
  { label: "Journal", icon: BookText },
  { label: "Maps", icon: Map },
  { label: "NPCs", icon: UserCircle2 },
  { label: "Items", icon: Package },
  { label: "Règles", icon: Scale },
  { label: "Dés", icon: Dices },
  { label: "Réglages", icon: Settings },
];

export default function CockpitPreview() {
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
          return { ...c, currentHp: Math.max(0, Math.min(c.maxHp, c.currentHp + delta)) };
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* ============ SIDEBAR ============ */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex items-center gap-2.5 border-b border-border p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/35 bg-primary/12 text-primary">
            <CrestGlyph size={22} />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">FAITH&nbsp;:&nbsp;RE</span>
            <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
              Campaign cockpit
            </span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <p className="px-1 pb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
            Navigation
          </p>
          {NAV.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              type="button"
              className={`flex h-9 items-center gap-2.5 rounded-md border px-2.5 text-sm transition-colors ${
                active
                  ? "border-primary/30 bg-primary/12 text-primary"
                  : "border-transparent text-foreground-muted hover:border-border hover:bg-surface-overlay hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-2 border-t border-border p-3">
          <CampaignStatus />
          <SessionTimer />
        </div>
      </aside>

      {/* ============ COLONNE PRINCIPALE ============ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-overlay"
          >
            <span className="font-medium">Nuit des Étoiles Filantes</span>
            <ChevronDown size={14} className="text-foreground-subtle" />
          </button>

          <span className="flex items-center gap-1.5 rounded-md border border-primary/35 bg-primary/12 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-primary">
            <Crown size={12} /> Mode MJ
          </span>

          <div className="ml-2 hidden items-center gap-3 font-mono text-[11px] text-foreground-subtle md:flex">
            <span>
              Session <span className="tabular-nums text-foreground-muted">14</span>
            </span>
            <span className="text-foreground-subtle/50">·</span>
            <span className="tabular-nums">26 avr. 2025</span>
          </div>

          <button
            type="button"
            aria-label="Rechercher"
            className="ml-auto flex h-8 items-center gap-2 rounded-md border border-border bg-card/80 px-2.5 text-xs text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Rechercher</span>
            <kbd className="hidden items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] sm:flex">
              <Command className="size-2.5" />K
            </kbd>
          </button>
          <Avatar className="h-8 w-8 rounded-md border border-border">
            <AvatarFallback className="rounded-md text-[11px]" style={avatarFallbackStyle("GM")}>
              GM
            </AvatarFallback>
          </Avatar>
        </header>

        {/* 3 panneaux */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Roster */}
          <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-border p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
                Roster
              </p>
              <span className="font-mono text-[10px] tabular-nums text-foreground-subtle">
                {chars.length}/{chars.length} présents
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {chars.map((c) => {
                const active = c.id === selId;
                const low = c.currentHp / c.maxHp < 0.5;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelId(c.id)}
                    className={`flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors ${
                      active
                        ? "border-primary/30 bg-primary/10"
                        : "border-transparent hover:border-border hover:bg-surface-overlay"
                    }`}
                  >
                    <Avatar className="size-8 rounded-md">
                      <AvatarFallback
                        className="rounded-md text-[11px]"
                        style={avatarFallbackStyle(c.name)}
                      >
                        {initialsOf(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                      <p
                        className="font-mono text-[10px] tabular-nums slashed-zero"
                        style={{ color: low ? "var(--hp)" : "var(--foreground-subtle)" }}
                      >
                        {c.currentHp}/{c.maxHp}
                      </p>
                    </div>
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: "#5c7d63" }}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Fiche centrale */}
          <main className="min-w-0 flex-1 overflow-y-auto p-5">
            <CharacterSheet
              character={selected}
              isMJ
              onVitalChange={onVitalChange}
              onSkillChange={onSkillChange}
              onFluxChange={onFluxChange}
            />
          </main>

          {/* Quick-Roll */}
          <aside className="w-72 shrink-0 overflow-y-auto border-l border-border p-3">
            <QuickRollPanel />
          </aside>
        </div>

        {/* Bottom bar */}
        <footer className="flex h-10 shrink-0 items-center justify-between border-t border-border px-4 text-[11px] text-foreground-subtle">
          <span className="font-mono">Sauvegardé il y a 2 min</span>
          <div className="flex items-center gap-4">
            <button type="button" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
              <MonitorPlay size={13} /> Écran MJ
            </button>
            <button type="button" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
              <Eye size={13} /> Vue joueur
            </button>
            <button type="button" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
              <FileDown size={13} /> Export PDF
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
