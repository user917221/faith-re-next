/**
 * RoundTableGlyph — cercle large entouré de 6 nœuds (joueurs) + sigil central.
 *
 * Usage : /plateau hero, sessions partagées.
 * Symbolise la table de jeu commune, le rituel collectif.
 *
 * Style : double cercle (table + ombre), 6 disques équidistants en couronne,
 * sigil ✦ central, lignes radiales fines.
 */
export function RoundTableGlyph({
  className,
  size = 200,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* halo extérieur */}
      <circle cx="100" cy="100" r="92" opacity="0.18" />

      {/* table — double cercle */}
      <circle cx="100" cy="100" r="68" />
      <circle cx="100" cy="100" r="62" opacity="0.45" />

      {/* runes inscrites sur l'anneau — 12 marques */}
      <g opacity="0.5">
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 100 + Math.cos(angle) * 64;
          const y1 = 100 + Math.sin(angle) * 64;
          const x2 = 100 + Math.cos(angle) * 68;
          const y2 = 100 + Math.sin(angle) * 68;
          return <path key={i} d={`M${x1} ${y1} L ${x2} ${y2}`} />;
        })}
      </g>

      {/* 6 joueurs autour — disques avec connexion radiale vers centre */}
      <g>
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const cx = 100 + Math.cos(angle) * 86;
          const cy = 100 + Math.sin(angle) * 86;
          const inX = 100 + Math.cos(angle) * 32;
          const inY = 100 + Math.sin(angle) * 32;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="6" />
              <circle
                cx={cx}
                cy={cy}
                r="2"
                fill="currentColor"
                stroke="none"
                opacity="0.7"
              />
              <path
                d={`M${100 + Math.cos(angle) * 68} ${100 + Math.sin(angle) * 68} L ${inX} ${inY}`}
                opacity="0.4"
              />
            </g>
          );
        })}
      </g>

      {/* sigil ✦ central — losange 4 pointes */}
      <g>
        <path d="M100 78 L 100 122" opacity="0.7" />
        <path d="M78 100 L 122 100" opacity="0.7" />
        <path d="M100 86 L 114 100 L 100 114 L 86 100 Z" />
        <circle cx="100" cy="100" r="2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
