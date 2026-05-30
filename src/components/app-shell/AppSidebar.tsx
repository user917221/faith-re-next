"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Dices, Scroll, ShieldHalf, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CrestGlyph } from "@/components/glyphs";
import { initialsOf, avatarFallbackStyle } from "@/lib/avatar";

export type ShellUser = {
  name: string;
  role: "mj" | "player" | "spectator";
  image: string | null;
};

const ROLE_LABEL: Record<ShellUser["role"], string> = {
  mj: "Meneur de jeu",
  player: "Joueur",
  spectator: "Spectateur",
};

export function AppSidebar({
  user,
  active,
}: {
  user: ShellUser;
  active: "plateau" | "me" | "mj";
}) {
  const nav = [
    { key: "plateau" as const, href: "/plateau", label: "Plateau", icon: Dices },
    { key: "me" as const, href: "/me", label: "Ma fiche", icon: Scroll },
    ...(user.role === "mj"
      ? [{ key: "mj" as const, href: "/mj", label: "Tableau MJ", icon: ShieldHalf }]
      : []),
  ];

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border/90">
      <SidebarHeader className="border-b border-sidebar-border/80 p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/35 bg-primary/12 text-primary shadow-[inset_0_1px_0_rgba(255,244,214,0.08)]">
            <CrestGlyph size={22} />
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold text-foreground">
              FAITH&nbsp;:&nbsp;RE
            </span>
            <span className="eyebrow mt-0.5">Campaign cockpit</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5 group-data-[collapsible=icon]:hidden">
          <div className="chrome-tile px-2 py-1.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-subtle">
              Mode
            </p>
            <p className="mt-0.5 truncate text-xs text-ink-muted">
              {ROLE_LABEL[user.role]}
            </p>
          </div>
          <div className="chrome-tile px-2 py-1.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-foreground-subtle">
              État
            </p>
            <p className="mt-0.5 text-xs text-primary">En session</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-3">
          <SidebarGroupLabel className="eyebrow px-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {nav.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={active === item.key}
                    tooltip={item.label}
                    className="h-9 rounded-md border border-transparent data-active:border-primary/30 data-active:bg-primary/12 data-active:text-primary hover:border-sidebar-border"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/80 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={user.name}
                  className="h-12 rounded-md border border-sidebar-border bg-sidebar-accent/35 hover:border-hairline-strong"
                >
                  <Avatar className="h-7 w-7 rounded-md">
                    {user.image && <AvatarImage src={user.image} alt={user.name} />}
                    <AvatarFallback
                      className="rounded-md text-2xs"
                      style={avatarFallbackStyle(user.name)}
                    >
                      {initialsOf(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-medium text-foreground">
                      {user.name}
                    </span>
                    <span className="truncate text-2xs text-muted-foreground">
                      {ROLE_LABEL[user.role]}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="min-w-44">
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
