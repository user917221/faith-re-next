"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Dices, Scroll, ShieldHalf, LogOut } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { ShellUser } from "./AppSidebar";

/**
 * Palette de commandes globale (⌘K / Ctrl+K).
 * Navigation rapide + actions. Montée par AppShell.
 */
export function CommandMenu({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Naviguer ou lancer une action…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/plateau")}>
            <Dices className="h-4 w-4" />
            Plateau de jeu
          </CommandItem>
          <CommandItem onSelect={() => go("/me")}>
            <Scroll className="h-4 w-4" />
            Ma fiche
          </CommandItem>
          {user.role === "mj" && (
            <CommandItem onSelect={() => go("/mj")}>
              <ShieldHalf className="h-4 w-4" />
              Tableau MJ
            </CommandItem>
          )}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Compte">
          <CommandItem onSelect={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}>
            <LogOut className="h-4 w-4" />
            Déconnexion
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
