/**
 * GrimoireGlyph — livre ouvert avec pages numérotées et sigil central.
 *
 * Usage : skills / entraînement / panneaux d'allocation.
 * Symbolise l'étude des sciences obscures.
 *
 * Style : reliure verticale, deux pages incurvées, sigil ✦ stylisé au centre,
 * traits numérotés (lignes de texte).
 */
export function GrimoireGlyph({
  className,
  size = 80,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* halo */}
      <circle cx="60" cy="60" r="50" opacity="0.18" />

      {/* tranche / reliure verticale */}
      <path d="M60 28 L60 96" opacity="0.5" />

      {/* page gauche — arc */}
      <path d="M60 28 C 40 28, 24 32, 18 36 L 18 92 C 24 88, 40 84, 60 84 L 60 28 Z" />

      {/* page droite — arc miroir */}
      <path d="M60 28 C 80 28, 96 32, 102 36 L 102 92 C 96 88, 80 84, 60 84 L 60 28 Z" />

      {/* lignes de texte — page gauche */}
      <g opacity="0.55">
        <path d="M28 44 L52 44" />
        <path d="M28 50 L48 50" />
        <path d="M28 56 L52 56" />
        <path d="M28 62 L46 62" />
        <path d="M28 68 L52 68" />
        <path d="M28 74 L44 74" />
      </g>

      {/* lignes de texte — page droite */}
      <g opacity="0.55">
        <path d="M68 44 L92 44" />
        <path d="M68 50 L88 50" />
        <path d="M68 56 L92 56" />
        <path d="M68 62 L86 62" />
        <path d="M68 68 L92 68" />
        <path d="M68 74 L84 74" />
      </g>

      {/* sceau / marque-page suspendu sous la reliure */}
      <path d="M60 96 L60 108" opacity="0.7" />
      <path d="M56 104 L60 108 L64 104" opacity="0.7" />

      {/* sigil ✦ central sous le pli */}
      <g transform="translate(60 84)" opacity="0">
        {/* placeholder — décor déjà dense */}
      </g>
    </svg>
  );
}
