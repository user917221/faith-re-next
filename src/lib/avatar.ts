/**
 * Helpers d'avatar — fallback initiales + couleur déterministe dérivée du nom.
 * Utilisé partout où un perso est représenté (roster, fiche, plateau, sidebar).
 */

/** Initiales d'un personnage : prénom + (nom de famille si présent). */
export function initialsOf(name: string, nom?: string | null): string {
  const a = (name?.[0] ?? "?").toUpperCase();
  const b = (nom?.trim()?.[0] ?? "").toUpperCase();
  return (a + b).slice(0, 2);
}

/**
 * Teinte HSL déterministe dérivée d'une chaîne (nom du perso).
 * Reste dans une gamme désaturée Linear (saturation/lightness contrôlées),
 * pour ne pas casser la discipline monochrome — juste assez pour distinguer.
 */
export function avatarHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) % 360;
  }
  return h;
}

/** Style de fallback (fond + texte) pour un Avatar sans portrait. */
export function avatarFallbackStyle(seed: string): { backgroundColor: string; color: string } {
  const hue = avatarHue(seed);
  return {
    backgroundColor: `hsl(${hue} 22% 22%)`,
    color: `hsl(${hue} 38% 78%)`,
  };
}
