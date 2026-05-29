/**
 * AscensionGlyph — flèche brisée pointant vers haut avec constellation autour.
 *
 * Usage : évolution / XP / progression de niveau.
 * Symbolise l'élévation par paliers, le chemin chaotique vers la maîtrise.
 *
 * Style : flèche en zigzag verticale, 4-5 étoiles satellites, halo discret.
 */
export function AscensionGlyph({
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
      {/* halo */}
      <circle cx="60" cy="60" r="48" opacity="0.18" />

      {/* base — palier */}
      <path d="M36 102 L 84 102" opacity="0.6" />
      <path d="M40 96 L 80 96" opacity="0.4" />

      {/* flèche brisée — zigzag montant */}
      <path d="M60 24 L 50 40 L 64 48 L 50 64 L 64 72 L 52 90" />

      {/* pointe en chevron */}
      <path d="M52 32 L 60 24 L 68 32" />

      {/* segments rappel à droite (écho fantôme) */}
      <g opacity="0.45">
        <path d="M70 44 L 74 50" />
        <path d="M70 64 L 74 70" />
      </g>

      {/* constellations — 5 étoiles satellites */}
      <g opacity="0.85">
        <circle cx="22" cy="32" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="32" cy="56" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="92" cy="38" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="100" cy="64" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="88" cy="84" r="1.4" fill="currentColor" stroke="none" />
      </g>

      {/* fils légers entre étoiles — réseau */}
      <g opacity="0.35">
        <path d="M22 32 L 32 56" />
        <path d="M92 38 L 100 64" />
        <path d="M100 64 L 88 84" />
      </g>
    </svg>
  );
}
