/**
 * ChaliceGlyph — calice rituel avec gouttes en suspension.
 *
 * Usage : fate / runes / points de destin.
 * Symbolise les offrandes mystiques, la chance suspendue.
 *
 * Style : coupe profilée, pied évasé, 3 gouttes flottantes au-dessus.
 */
export function ChaliceGlyph({
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
      <circle cx="60" cy="60" r="48" opacity="0.2" />

      {/* gouttes flottantes au-dessus */}
      <g opacity="0.85">
        <path d="M48 20 C 46 24, 46 28, 48 30 C 50 28, 50 24, 48 20 Z" />
        <path d="M60 14 C 58 18, 58 22, 60 24 C 62 22, 62 18, 60 14 Z" />
        <path d="M72 20 C 70 24, 70 28, 72 30 C 74 28, 74 24, 72 20 Z" />
      </g>

      {/* lèvre du calice */}
      <path d="M38 40 L82 40" />
      <path d="M40 44 L80 44" opacity="0.6" />

      {/* coupe profilée — courbe gauche puis droite */}
      <path d="M38 40 C 38 56, 44 68, 56 72 L 56 84" />
      <path d="M82 40 C 82 56, 76 68, 64 72 L 64 84" />

      {/* anneau intérieur — niveau du liquide */}
      <path d="M44 50 C 50 54, 70 54, 76 50" opacity="0.55" />

      {/* tige */}
      <path d="M56 84 L 56 92 M 64 84 L 64 92" />

      {/* nœud central */}
      <circle cx="60" cy="92" r="4" />

      {/* pied évasé */}
      <path d="M60 96 L 60 102" />
      <path d="M44 106 L 76 106" />
      <path d="M48 106 C 52 102, 68 102, 72 106" />

      {/* point central — joyau dans la coupe */}
      <circle cx="60" cy="50" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
