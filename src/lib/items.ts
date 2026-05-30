/**
 * Types d'objets d'inventaire (Phase 6). Distinct des runes.
 */
export const ITEM_TYPES = ["arme", "armure", "objet", "consommable"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  arme: "Armes",
  armure: "Armures",
  objet: "Objets",
  consommable: "Consommables",
};
