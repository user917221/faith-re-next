"use client";

import { Search } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar, type ShellUser } from "./AppSidebar";
import { CommandMenu } from "./CommandMenu";

/**
 * Coquille applicative — sidebar persistante + topbar + palette ⌘K.
 * Importée par /me, /mj, /plateau. La page server passe l'utilisateur + l'onglet actif.
 */
export function AppShell({
  user,
  active,
  title,
  children,
}: {
  user: ShellUser;
  active: "plateau" | "me" | "mj";
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} active={active} />
      <CommandMenu user={user} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          {title && (
            <span className="text-sm font-medium tracking-tight text-foreground">
              {title}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true }),
              );
            }}
            className="ml-auto flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-hairline-strong hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Rechercher</span>
            <kbd className="tabular hidden rounded border border-border bg-muted px-1 text-[0.65rem] sm:inline">
              ⌘K
            </kbd>
          </button>
        </header>
        <div className="flex-1 p-4 lg:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
