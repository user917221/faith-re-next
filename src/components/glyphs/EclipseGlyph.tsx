/**
 * EclipseGlyph — disque solaire éclipsé avec rayons fragmentés.
 *
 * Usage : récupération Endurance, souffle naturel.
 * Symbolise la régénération par cycle céleste.
 *
 * Style : deux disques superposés (soleil + lune), rayons en couronne discontinue.
 */
export function EclipseGlyph({
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
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* halo extérieur */}
      <circle cx="60" cy="60" r="50" opacity="0.18" />

      {/* couronne de rayons fragmentés — 12 traits courts */}
      <g opacity="0.85">
        <path d="M60 6 L60 14" />
        <path d="M60 106 L60 114" />
        <path d="M6 60 L14 60" />
        <path d="M106 60 L114 60" />
        <path d="M22 22 L28 28" />
        <path d="M92 92 L98 98" />
        <path d="M98 22 L92 28" />
        <path d="M28 92 L22 98" />
        <path d="M60 18 L60 22" opacity="0.6" />
        <path d="M60 98 L60 102" opacity="0.6" />
        <path d="M18 60 L22 60" opacity="0.6" />
        <path d="M98 60 L102 60" opacity="0.6" />
      </g>

      {/* disque solaire (soleil) */}
      <circle cx="60" cy="60" r="28" />

      {/* disque lunaire éclipsant (décalé) */}
      <circle cx="68" cy="56" r="24" opacity="0.55" />

      {/* croissant intérieur — arc gauche du soleil non couvert */}
      <path d="M48 38 C 36 46, 36 74, 48 82" opacity="0.9" />

      {/* point central — œil de l'éclipse */}
      <circle cx="60" cy="60" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
