/**
 * CrestGlyph — sceau héraldique avec ornement supérieur et sigil central.
 *
 * Usage : profile / identité / blason de personnage.
 * Symbolise la marque personnelle, l'identité héritée.
 *
 * Style : écusson en blason classique, couronne / cimier épuré au sommet,
 * sigil ✦ central, traits décoratifs symétriques.
 */
export function CrestGlyph({
  className,
  size = 100,
  initials,
}: {
  className?: string;
  size?: number;
  initials?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={(size * 140) / 120}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* cimier / couronne stylisée au sommet */}
      <g opacity="0.85">
        <path d="M40 18 L 80 18" />
        <path d="M44 18 L 44 12 L 48 16 L 52 10 L 56 16 L 60 8 L 64 16 L 68 10 L 72 16 L 76 12 L 76 18" />
      </g>

      {/* anneau de support */}
      <path d="M36 24 L 84 24" opacity="0.55" />

      {/* écusson en blason */}
      <path d="M30 30 L 90 30 L 90 80 C 90 100, 78 116, 60 128 C 42 116, 30 100, 30 80 L 30 30 Z" />

      {/* bordure intérieure */}
      <path d="M36 34 L 84 34 L 84 78 C 84 96, 73 110, 60 120 C 47 110, 36 96, 36 78 L 36 34 Z" opacity="0.45" />

      {/* sigil ✦ central — losange 4 pointes */}
      <g opacity="0.85">
        <path d="M60 50 L 60 90" opacity="0.6" />
        <path d="M42 70 L 78 70" opacity="0.6" />
        <path d="M60 58 L 72 70 L 60 82 L 48 70 Z" />
        <circle cx="60" cy="70" r="1.5" fill="currentColor" stroke="none" />
      </g>

      {/* initiales optionnelles */}
      {initials && (
        <text
          x="60"
          y="106"
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-display, serif)"
          letterSpacing="0.18em"
          fill="currentColor"
          stroke="none"
          opacity="0.85"
        >
          {initials}
        </text>
      )}

      {/* glands latéraux décoratifs */}
      <g opacity="0.45">
        <path d="M22 60 L 28 64" />
        <path d="M98 60 L 92 64" />
        <path d="M22 60 L 22 68" />
        <path d="M98 60 L 98 68" />
      </g>
    </svg>
  );
}
