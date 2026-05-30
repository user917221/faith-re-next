"use client";

import type { ReactNode } from "react";
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
import { CrestGlyph } from "@/components/glyphs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarFallbackStyle, initialsOf } from "@/lib/avatar";
import { CommandMenu } from "@/components/app-shell/CommandMenu";
import type { ShellUser } from "@/components/app-shell/AppSidebar";
import { CampaignStatus } from "./CampaignStatus";
import { SessionTimer } from "./SessionTimer";
import { QuickRollPanel } from "./QuickRollPanel";

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

/**
 * CockpitShell — chrome du cockpit MJ : nav-sidebar (nav + Campaign Status +
 * Session Timer), top bar (campagne / Mode MJ / session / ⌘K / avatar), grille
 * 3-panneaux (Roster | centre | Quick-Roll), bottom bar. Les panes sont passés
 * en props. Phase 1 : campagne/session/status en stub (câblés Phase 5).
 */
export function CockpitShell({
  user,
  campaignName = "Nuit des Étoiles Filantes",
  sessionNumber = 14,
  sessionDate = "26 avr. 2025",
  roster,
  children,
  rollPanel,
  campaignSelector,
  campaignStatus,
  sessionTimer,
}: {
  user: ShellUser;
  campaignName?: string;
  sessionNumber?: number;
  sessionDate?: string;
  roster: ReactNode;
  children: ReactNode;
  rollPanel?: ReactNode;
  campaignSelector?: ReactNode;
  campaignStatus?: ReactNode;
  sessionTimer?: ReactNode;
}) {
  const openPalette = () =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
    );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <CommandMenu user={user} />

      {/* ============ NAV SIDEBAR ============ */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
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
          {campaignStatus ?? <CampaignStatus />}
          {sessionTimer ?? <SessionTimer />}
        </div>
      </aside>

      {/* ============ COLONNE PRINCIPALE ============ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl">
          {campaignSelector ?? (
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-overlay"
            >
              <span className="truncate font-medium">{campaignName}</span>
              <ChevronDown size={14} className="text-foreground-subtle" />
            </button>
          )}

          {user.role === "mj" && (
            <span className="hidden items-center gap-1.5 rounded-md border border-primary/35 bg-primary/12 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-primary sm:flex">
              <Crown size={12} /> Mode MJ
            </span>
          )}

          <div className="ml-2 hidden items-center gap-3 font-mono text-[11px] text-foreground-subtle md:flex">
            <span>
              Session{" "}
              <span className="tabular-nums text-foreground-muted">{sessionNumber}</span>
            </span>
            <span className="text-foreground-subtle/50">·</span>
            <span className="tabular-nums">{sessionDate}</span>
          </div>

          <button
            type="button"
            aria-label="Rechercher (⌘K)"
            onClick={openPalette}
            className="ml-auto flex h-8 items-center gap-2 rounded-md border border-border bg-card/80 px-2.5 text-xs text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Rechercher</span>
            <kbd className="hidden items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] sm:flex">
              <Command className="size-2.5" />K
            </kbd>
          </button>
          <Avatar className="h-8 w-8 rounded-md border border-border">
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback
              className="rounded-md text-[11px]"
              style={avatarFallbackStyle(user.name || "MJ")}
            >
              {initialsOf(user.name || "MJ")}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* 3 panneaux */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="hidden w-72 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border p-3 md:flex">
            {roster}
          </aside>
          <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-5">{children}</main>
          <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-border p-3 xl:block">
            {rollPanel ?? <QuickRollPanel />}
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
