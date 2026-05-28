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
