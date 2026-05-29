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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground">
            <Dices className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              FAITH&nbsp;:&nbsp;RE
            </span>
            <span className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Compagnon
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={active === item.key}
                    tooltip={item.label}
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip={user.name}>
                  <Avatar className="h-7 w-7 rounded-md">
                    {user.image && <AvatarImage src={user.image} alt={user.name} />}
                    <AvatarFallback
                      className="rounded-md text-[0.7rem]"
                      style={avatarFallbackStyle(user.name)}
                    >
                      {initialsOf(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-medium text-foreground">
                      {user.name}
                    </span>
                    <span className="truncate text-[0.7rem] text-muted-foreground">
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
