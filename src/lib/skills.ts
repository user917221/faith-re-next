/**
 * Attributs et compétences FAITH : RE.
 * 4 attributs Disco Elysium-style × 5 compétences = 20 skills, cap 80 pts.
 */

export const SKILL_GROUPS = {
  INTELLECT: ["Encyclopédie", "Logique", "Rhétorique", "Drame", "Conceptualisation"],
  PSYCHÉ: ["Sang-Froid", "Divination", "Empathie", "Autorité", "Suggestion"],
  CONSTITUTION: ["Résilience", "Volonté", "Inflexibilité", "Écaillé", "Sixième Sens"],
  MANŒUVRE: ["Coordination Main/Œil", "Savoir-Faire", "Puissance", "Vitesse de Réaction", "Perception"],
} as const;

export type AttributeName = keyof typeof SKILL_GROUPS;

export const SKILL_DESCRIPTIONS: Record<string, string> = {
  Encyclopédie: "Connaissances générales",
  Logique: "Déductions",
  Rhétorique: "Persuasion argumentative",
  Drame: "Détection mensonges, bluff",
  Conceptualisation: "Créativité artisanale",
  "Sang-Froid": "Contrôle facial, impassibilité",
  Divination: "Intuition mystique",
  Empathie: "Compréhension émotionnelle",
  Autorité: "Imposer respect, leadership",
  Suggestion: "Manipulation subtile",
  Résilience: "Résistance physique",
  Volonté: "Résistance mentale",
  Inflexibilité: "Tolérance aux poisons et drogues",
  Écaillé: "Régénération naturelle du corps",
  "Sixième Sens": "Intuition environnement",
  "Coordination Main/Œil": "Tir, crochetage",
  "Savoir-Faire": "Réflexes, habileté",
  Puissance: "Force brute",
  "Vitesse de Réaction": "Agilité, rapidité",
  Perception: "Observation détails",
};

// Liste plate des skills (pour seed BDD)
export const ALL_SKILLS = Object.values(SKILL_GROUPS).flat();

// Lookup attribut <- skill
export const SKILL_TO_ATTRIBUTE: Record<string, AttributeName> = Object.entries(SKILL_GROUPS).reduce(
  (acc, [attr, skills]) => {
    for (const s of skills) acc[s] = attr as AttributeName;
    return acc;
  },
  {} as Record<string, AttributeName>,
);

// Shorthand pour formules custom (2d6+INT, etc.)
export const ATTR_SHORTHAND: Record<string, AttributeName> = {
  INT: "INTELLECT",
  PSY: "PSYCHÉ",
  CON: "CONSTITUTION",
  MAN: "MANŒUVRE",
  MNV: "MANŒUVRE",
};

// ---------------- Paliers de compétence (rank / tier) ----------------
// Dérivés des points alloués — NE change PAS le moteur de jets (2d6 + attr +
// points). Sert à l'affichage cockpit : rang, badge de palier, barre de niveau.

export type SkillTierKey = "novice" | "trained" | "expert" | "master";
export type SkillTierInfo = {
  key: SkillTierKey;
  label: string;
  min: number; // borne basse (incluse)
  range: string; // libellé de plage pour la légende
  rgb: string; // teinte du chip (sur fond sombre)
};

export const SKILL_TIERS: SkillTierInfo[] = [
  { key: "novice", label: "Novice", min: 0, range: "0–3", rgb: "150,150,168" },
  { key: "trained", label: "Confirmé", min: 4, range: "4–7", rgb: "130,169,107" },
  { key: "expert", label: "Expert", min: 8, range: "8–11", rgb: "111,166,184" },
  { key: "master", label: "Maître", min: 12, range: "12+", rgb: "196,154,92" },
];

/** Palier d'une compétence selon ses points. */
export function getSkillTier(points: number): SkillTierInfo {
  if (points >= 12) return SKILL_TIERS[3];
  if (points >= 8) return SKILL_TIERS[2];
  if (points >= 4) return SKILL_TIERS[1];
  return SKILL_TIERS[0];
}

// Plafond d'affichage pour la barre de niveau (un skill au-delà = plein).
export const SKILL_DISPLAY_MAX = 16;

/** Score d'attribut = somme des 5 skills sous-jacents. */
export function calculateAttribute(
  skills: Record<string, number>,
  attribute: AttributeName,
): number {
  return SKILL_GROUPS[attribute].reduce((acc, sk) => acc + (skills[sk] ?? 0), 0);
}

/** Somme totale des points alloués (pour vérifier le cap 80). */
export function countAllocatedPoints(skills: Record<string, number>): number {
  return ALL_SKILLS.reduce((acc, sk) => acc + (skills[sk] ?? 0), 0);
}
