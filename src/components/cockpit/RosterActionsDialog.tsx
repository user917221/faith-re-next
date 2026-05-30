"use client";

/**
 * Modales MJ du roster (#84) :
 *  - CreateCharacterDialog : crée un perso (input prénom + défauts sains).
 *  - DeleteCharacterDialog  : confirme la suppression, liste les dépendances
 *    supprimées en cascade + les jets « orphelins » (public_roll → SET NULL).
 *
 * Réservées au MJ (montées uniquement côté MJ par RosterNav). Réutilisent le
 * Dialog radix existant — pas d'AlertDialog dans le projet, donc Dialog +
 * bouton destructif pour la confirmation.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createCharacter, deleteCharacter } from "@/lib/actions";

/* ============================================================
 * CreateCharacterDialog — bouton « + Ajouter » + modale de création.
 * Après succès : router.refresh() puis navigue vers le nouveau perso.
 * ============================================================ */
export function CreateCharacterDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const clean = name.trim();
    if (!clean) return;
    startTransition(async () => {
      const res = await createCharacter(clean);
      if (!res.ok) {
        toast.error(res.reason);
        return; // garder la modale ouverte pour relancer
      }
      toast.success(`Personnage « ${clean} » créé`, {
        description: "Ajouté au roster (MJ seul, sans lien joueur).",
      });
      setName("");
      setOpen(false);
      router.push(`/mj?id=${res.id}`);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size="xs"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1"
        aria-label="Ajouter un personnage"
      >
        <Plus className="size-3" />
        Ajouter
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un personnage</DialogTitle>
          <DialogDescription>
            Un nouveau personnage joueur, initialisé avec des valeurs par défaut.
            Il reste visible du MJ seul tant qu&apos;il n&apos;est pas relié à un
            compte.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="new-character-name">Prénom</Label>
          <Input
            id="new-character-name"
            value={name}
            autoFocus
            maxLength={60}
            placeholder="Prénom du personnage"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
          <p className="text-2xs text-muted-foreground">
            Sert aux commandes du bot. 60 caractères max, sans doublon.
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Annuler
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={isPending || !name.trim()}
            onClick={submit}
          >
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 * DeleteCharacterDialog — icône poubelle (au survol de l'entrée) + modale de
 * confirmation. Liste les dépendances en cascade. Après succès : si le perso
 * supprimé était sélectionné, retourne à /mj (1er perso restant).
 * ============================================================ */
export function DeleteCharacterDialog({
  characterId,
  characterName,
  isSelected,
}: {
  characterId: string;
  characterName: string;
  isSelected: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const confirm = () => {
    startTransition(async () => {
      const res = await deleteCharacter(characterId);
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      const total =
        res.deletedSkills +
        res.deletedRunes +
        res.deletedConditions +
        res.deletedCompetencesAlea +
        res.deletedItems +
        res.deletedStatusNotes +
        res.deletedTrainingRequests;
      toast.success(`« ${res.name} » supprimé`, {
        description: `${total} ligne${total > 1 ? "s" : ""} liée${
          total > 1 ? "s" : ""
        } supprimée${total > 1 ? "s" : ""}${
          res.orphanedPublicRolls > 0
            ? ` · ${res.orphanedPublicRolls} jet${
                res.orphanedPublicRolls > 1 ? "s" : ""
              } conservé${res.orphanedPublicRolls > 1 ? "s" : ""}`
            : ""
        }.`,
      });
      setOpen(false);
      // Si le perso supprimé était affiché, repartir sur le roster (1er restant).
      if (isSelected) router.push("/mj");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Supprimer ${characterName}`}
        title="Supprimer"
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-foreground-subtle opacity-60 transition-[opacity,color,background-color] hover:bg-destructive/15 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-destructive" />
            Supprimer « {characterName} »
          </DialogTitle>
          <DialogDescription>
            Cette action est définitive. Les données liées au personnage sont
            supprimées en cascade :
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-1 text-2xs text-muted-foreground">
          <li>• Compétences, runes, conditions, compétences de l&apos;Aléa</li>
          <li>• Objets, notes de statut, demandes d&apos;entraînement</li>
        </ul>
        <p className="text-2xs text-ink-tertiary">
          Les jets déjà inscrits au plateau sont conservés (le personnage y est
          détaché, son nom reste affiché). Le journal de campagne n&apos;est pas
          affecté.
        </p>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Annuler
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={confirm}
          >
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
