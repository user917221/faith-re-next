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

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
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
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Désarme tout seul après 3 s si on ne reconfirme pas.
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  // 1er clic = arme (poubelle → coche rouge). 2e clic = supprime.
  // Aucun Dialog radix : le chemin est blindé (le Dialog posait souci).
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const res = await deleteCharacter(characterId);
      if (!res.ok) {
        toast.error(res.reason);
        setConfirming(false);
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
      setConfirming(false);
      if (isSelected) router.push("/mj");
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={
        confirming
          ? `Confirmer la suppression de ${characterName}`
          : `Supprimer ${characterName}`
      }
      title={
        confirming
          ? "Cliquer encore pour confirmer la suppression"
          : "Supprimer le personnage"
      }
      className={`flex size-6 shrink-0 items-center justify-center rounded-md transition-[opacity,color,background-color] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 ${
        confirming
          ? "bg-destructive text-white opacity-100"
          : "text-foreground-subtle opacity-60 hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
      }`}
    >
      {confirming ? (
        <Check className="size-3.5" />
      ) : (
        <Trash2 className="size-3.5" />
      )}
    </button>
  );
}
