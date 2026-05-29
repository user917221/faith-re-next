/**
 * Bibliothèque des glyphes signature FAITH : RE.
 *
 * Style commun :
 *  - SVG inline custom dessiné à la ligne fine gold-aged
 *  - stroke="currentColor", strokeWidth 1.2-1.4, fill="none"
 *  - viewBox carré 120x120 (sauf CrestGlyph en 120x140)
 *  - hérite la couleur du parent → utiliser text-gold-aged / text-gold-bright
 *  - lignes fluides, arcs et courbes (jamais d'angles vifs)
 *  - quelques points fill currentColor (1-2px) pour accents
 *
 * Usage typique dans hero card :
 *   <ConstellationGlyph className="text-gold-aged" size={200} />
 */
export { ConstellationGlyph } from "./ConstellationGlyph";
export { CalvaryGlyph } from "./CalvaryGlyph";
export { EclipseGlyph } from "./EclipseGlyph";
export { GrimoireGlyph } from "./GrimoireGlyph";
export { ChaliceGlyph } from "./ChaliceGlyph";
export { AscensionGlyph } from "./AscensionGlyph";
export { RoundTableGlyph } from "./RoundTableGlyph";
export { CrestGlyph } from "./CrestGlyph";
