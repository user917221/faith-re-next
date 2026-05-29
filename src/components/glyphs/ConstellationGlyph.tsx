/**
 * ConstellationGlyph — étoile centrale rayonnante reliée à 6 satellites par lignes fines.
 *
 * Usage : landing /, signin/page. Symbolise l'ouverture du grimoire,
 * la convocation des joueurs autour de la table.
 *
 * Style : trait fin gold-aged, halo subtil radial, points satellites accentués.
 */
export function ConstellationGlyph({
  className,
  size = 120,
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
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* halo radial — opacity 30 */}
      <circle cx="60" cy="60" r="44" opacity="0.18" />
      <circle cx="60" cy="60" r="32" opacity="0.28" />

      {/* étoile centrale — 6 branches */}
      <g>
        <path d="M60 30 L60 90" />
        <path d="M34 60 L86 60" />
        <path d="M42 42 L78 78" />
        <path d="M78 42 L42 78" />
      </g>

      {/* losange central pour densité */}
      <path d="M60 48 L72 60 L60 72 L48 60 Z" />

      {/* point central */}
      <circle cx="60" cy="60" r="1.6" fill="currentColor" stroke="none" />

      {/* 6 satellites reliés au centre par lignes fines */}
      <g opacity="0.85">
        {/* haut */}
        <circle cx="60" cy="14" r="1.6" fill="currentColor" stroke="none" />
        <path d="M60 30 L60 18" opacity="0.5" />
        {/* haut droite */}
        <circle cx="100" cy="32" r="1.4" fill="currentColor" stroke="none" />
        <path d="M82 46 L96 34" opacity="0.5" />
        {/* bas droite */}
        <circle cx="100" cy="92" r="1.4" fill="currentColor" stroke="none" />
        <path d="M82 76 L96 90" opacity="0.5" />
        {/* bas */}
        <circle cx="60" cy="110" r="1.6" fill="currentColor" stroke="none" />
        <path d="M60 90 L60 106" opacity="0.5" />
        {/* bas gauche */}
        <circle cx="20" cy="92" r="1.4" fill="currentColor" stroke="none" />
        <path d="M38 76 L24 90" opacity="0.5" />
        {/* haut gauche */}
        <circle cx="20" cy="32" r="1.4" fill="currentColor" stroke="none" />
        <path d="M38 46 L24 34" opacity="0.5" />
      </g>
    </svg>
  );
}
