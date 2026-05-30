"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeepWarmToggle } from "@/components/app-shell/KeepWarmToggle";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BookText,
  Map,
  UserCircle2,
  Package,
  Scale,
  History,
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
import { SessionTimer } from "./SessionTimer";
import { QuickRollPanel } from "./QuickRollPanel";

const NAV: {
  label: string;
  icon: typeof LayoutDashboard;
  view?: string;
  href?: string;
  soon?: boolean;
}[] = [
  { label: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
  { label: "Roster", icon: Users, soon: true },
  { label: "Sessions", icon: CalendarDays, soon: true },
  { label: "Journal", icon: BookText, view: "journal" },
  { label: "Maps", icon: Map, soon: true },
  { label: "NPCs", icon: UserCircle2, view: "npcs" },
  { label: "Items", icon: Package, soon: true },
  { label: "Logs", icon: History, view: "logs" },
  { label: "Règles", icon: Scale, view: "regles" },
  { label: "Plateau", icon: Dices, href: "/plateau" },
  { label: "Réglages", icon: Settings, soon: true },
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
  sessionTimer,
  activeView = "dashboard",
  playerView = false,
}: {
  user: ShellUser;
  campaignName?: string;
  sessionNumber?: number;
  sessionDate?: string;
  roster: ReactNode;
  children: ReactNode;
  rollPanel?: ReactNode;
  campaignSelector?: ReactNode;
  sessionTimer?: ReactNode;
  activeView?: string;
  playerView?: boolean;
}) {
  const searchParams = useSearchParams();
  const openPalette = () =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
    );

  // Lien qui (dé)bascule le mode joueur en conservant id / view courants.
  const modeHref = (mode: "mj" | "player") => {
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    if (mode === "player") p.set("mode", "player");
    else p.delete("mode");
    const q = p.toString();
    return q ? `?${q}` : "?";
  };

  return (
    <div className="cockpit-root flex h-screen w-full overflow-hidden bg-background text-foreground">
      <CommandMenu user={user} />

      {/* ============ NAV SIDEBAR ============ */}
      <aside className="cockpit-chrome chrome-rail hidden w-60 shrink-0 flex-col border-r border-border lg:flex">
        <div className="flex items-center gap-2.5 border-b border-border p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/35 bg-primary/12 text-primary">
            <CrestGlyph size={22} />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">FAITH&nbsp;:&nbsp;RE</span>
            <span className="eyebrow mt-0.5">Campaign cockpit</span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-none p-3">
          <p className="eyebrow px-1 pb-1">Navigation</p>
          {NAV.map(({ label, icon: Icon, view, href, soon }) => {
            const active = view !== undefined && view === activeView;
            const cls = `flex h-9 items-center gap-2.5 rounded-md border px-2.5 text-sm transition-colors ${
              active
                ? "border-primary/30 bg-primary/12 text-primary"
                : "border-transparent text-foreground-muted hover:border-border hover:bg-surface-overlay hover:text-foreground"
            }`;
            if (soon) {
              return (
                <button
                  key={label}
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Bientôt"
                  className="flex h-9 cursor-not-allowed items-center gap-2.5 rounded-md border border-transparent px-2.5 text-sm text-foreground-subtle/60"
                >
                  <Icon size={16} />
                  <span>{label}</span>
                  <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.12em] text-foreground-subtle/50">
                    Bientôt
                  </span>
                </button>
              );
            }
            if (href) {
              return (
                <Link key={label} href={href} className={cls}>
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              );
            }
            return view ? (
              <Link key={label} href={`?view=${view}`} className={cls}>
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ) : (
              <button key={label} type="button" className={cls}>
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2 border-t border-border p-3">
          {sessionTimer ?? <SessionTimer />}
        </div>
      </aside>

      {/* ============ COLONNE PRINCIPALE ============ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="cockpit-chrome relative z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {campaignSelector ?? (
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-overlay"
            >
              <span className="truncate font-medium">{campaignName}</span>
              <ChevronDown size={14} className="text-foreground-subtle" />
            </button>
          )}

          {playerView ? (
            <span className="hidden items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-foreground-muted sm:flex">
              <Eye size={12} /> Vue joueur
            </span>
          ) : (
            user.role === "mj" && (
              <span className="hidden items-center gap-1.5 rounded-md border border-primary/35 bg-primary/12 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-primary sm:flex">
                <Crown size={12} /> Mode MJ
              </span>
            )
          )}

          <div className="ml-2 hidden items-center gap-3 font-mono text-[11px] text-foreground-subtle md:flex">
            <span>
              Session{" "}
              <span className="tabular-nums text-foreground-muted">{sessionNumber}</span>
            </span>
            <span className="text-foreground-subtle/50">·</span>
            <span className="tabular-nums">{sessionDate}</span>
          </div>

          <KeepWarmToggle className="ml-auto" />
          <ThemeToggle />
          <button
            type="button"
            aria-label="Rechercher (⌘K)"
            onClick={openPalette}
            className="flex h-8 items-center gap-2 rounded-md border border-border bg-card/80 px-2.5 text-xs text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground"
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
          <aside className="cockpit-chrome hidden w-72 shrink-0 flex-col gap-3 overflow-y-auto overscroll-none border-r border-border p-3 md:flex">
            {roster}
          </aside>
          <main className="cockpit-print-area min-w-0 flex-1 overflow-y-auto overscroll-none p-4 lg:p-5">
            {children}
          </main>
          <aside className="cockpit-chrome hidden w-72 shrink-0 overflow-y-auto overscroll-none border-l border-border p-3 xl:block">
            {rollPanel ?? <QuickRollPanel />}
          </aside>
        </div>

        {/* Bottom bar */}
        <footer className="cockpit-chrome chrome-rail flex h-10 shrink-0 items-center justify-between border-t border-border px-4 text-[11px] text-foreground-subtle">
          <span className="font-mono">FAITH&nbsp;:&nbsp;RE — cockpit</span>
          <div className="flex items-center gap-4">
            <Link
              href={modeHref("mj")}
              className={`flex items-center gap-1.5 transition-colors hover:text-foreground ${
                !playerView ? "text-primary" : ""
              }`}
            >
              <MonitorPlay size={13} /> Écran MJ
            </Link>
            <Link
              href={modeHref("player")}
              className={`flex items-center gap-1.5 transition-colors hover:text-foreground ${
                playerView ? "text-primary" : ""
              }`}
            >
              <Eye size={13} /> Vue joueur
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <FileDown size={13} /> Export PDF
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
