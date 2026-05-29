/**
 * CalvaryGlyph — cœur runique avec serpents enroulés en caducée alchimique.
 *
 * Usage : récupération HP, panel régénération.
 * Symbolise la guérison par les forces opposées équilibrées.
 *
 * Style : cœur central, deux serpents miroir aux flancs, croix en haut.
 */
export function CalvaryGlyph({
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
      {/* cercle d'ancrage */}
      <circle cx="60" cy="60" r="46" opacity="0.22" />

      {/* croix calvaire haut */}
      <path d="M60 14 L60 26 M54 20 L66 20" opacity="0.7" />

      {/* cœur runique central */}
      <path d="M60 44 C 50 32, 36 38, 36 50 C 36 64, 60 84, 60 84 C 60 84, 84 64, 84 50 C 84 38, 70 32, 60 44 Z" />

      {/* veine centrale */}
      <path d="M60 46 L60 76" opacity="0.4" />
      <path d="M50 56 L70 56" opacity="0.3" />

      {/* serpent gauche enroulé (sinusoïde verticale) */}
      <path
        d="M30 38 C 26 46, 34 54, 30 62 C 26 70, 34 78, 30 88"
        opacity="0.75"
      />
      <circle cx="30" cy="36" r="1.5" fill="currentColor" stroke="none" />

      {/* serpent droit (miroir) */}
      <path
        d="M90 38 C 94 46, 86 54, 90 62 C 94 70, 86 78, 90 88"
        opacity="0.75"
      />
      <circle cx="90" cy="36" r="1.5" fill="currentColor" stroke="none" />

      {/* touffes basses — pied */}
      <path d="M52 96 L60 90 L68 96" opacity="0.6" />
    </svg>
  );
}
