export const meta = {
  name: 'faith-re-linear-shadcn-migration',
  description: 'Migrer FAITH:RE vers shadcn/ui + esthétique Linear (6 agents parallèles)',
  phases: [
    { title: 'Migration', detail: '6 agents : vitaux, skills/jets, évolution/profil, orchestrateur+glyphs, plateau, pages' },
  ],
}

const SHARED = [
  "## Contexte — FAITH : RE migration vers shadcn/ui + Linear",
  "",
  "Projet dans C:/Users/newgenprometheus/42/faith-re-next/ — Next.js 16 + React 19 + Tailwind 4 + Drizzle/Neon.",
  "On migre du grimoire vers le système LINEAR (linear.app) avec shadcn/ui comme base de composants. Glyphes conservés en accent MONOCHROME discret.",
  "",
  "## Système Linear (tokens shadcn déjà configurés dans globals.css)",
  "Utilise les tokens shadcn/Tailwind (déjà mappés aux valeurs Linear) :",
  "- bg-background (#010102 near-black canvas) · bg-card (#0f1011 surface-1) · bg-popover (#141516 surface-2) · bg-secondary / bg-muted (#18191a surface-3)",
  "- text-foreground (#f7f8f8) · text-muted-foreground (#8a8f98) · text-ink-muted (#d0d6e0) · text-ink-tertiary (#62666d)",
  "- border-border (#23252a hairline) · border-hairline-strong (#34343a)",
  "- ACCENT UNIQUE : text-primary / bg-primary (#5e6ad2 lavande) · text-primary-hover (#828fff) — RARE, jamais décoratif (brand, focus, 1 CTA/section)",
  "- vitaux JDR : text-hp/bg-hp (#e5484d rouge) · text-mhp (#2bb8c4 cyan) · text-endu (#30a46c vert)",
  "- radius : rounded-lg (12px, cards) · rounded-md (8px, boutons/inputs) · rounded-sm",
  "- ring : ring-ring (lavande) via focus-visible",
  "",
  "## Composants shadcn disponibles (src/components/ui/)",
  "button, card (Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter), badge, input, label, select, separator, tabs, tooltip, progress, scroll-area, sheet, avatar, dialog, dropdown-menu, skeleton.",
  "Import : `import { Card, CardContent } from '@/components/ui/card'` etc.",
  "Button variants : default (lavande), secondary, outline, ghost, destructive. Sizes : default, sm, lg, icon.",
  "",
  "## Principes Linear (CRITIQUE pour le craft)",
  "1. Surface ladder SANS ombres : hiérarchie par teinte (canvas→card→popover→muted) + hairlines 1px. JAMAIS de drop-shadow lourd, de halo, de gradient décoratif.",
  "2. Accent lavande SCARCE : brand mark, focus ring, 1 CTA primaire par section. Le reste est gris/ink. Pas de lavande décoratif.",
  "3. Dense, technique, software-craft. Spacing 4px base. Cards rounded-lg 12px + border-border 1px.",
  "4. Typo : Inter partout. Display = Inter gros + tracking négatif (-0.025em sur h1/h2). Body 14-16px. Eyebrow = uppercase tracking +0.06em text-muted-foreground 12px. Nombres = font-mono (.tabular).",
  "5. Big numbers (HP, scores, totaux jets) en .big-number (mono tabular, clamp 2.5-4.5rem) ou text-4xl/5xl tabular.",
  "6. Glyphes (@/components/glyphs) : accent MONOCHROME discret — text-muted-foreground ou text-ink-tertiary, petite taille. Plus de rotation tape-à-l'œil ni de lavande dessus (sauf 1 hero signin/landing en text-primary subtil).",
  "",
  "## Classes utilitaires legacy (encore dispo, réskinnées Linear)",
  ".card-grimoire (= card plat surface-1+hairline), .btn-grimoire (= bouton lavande), .btn-ghost, .input-grimoire, .label-grimoire (= eyebrow), .list-portfolio, .big-number, .tabular, .sigil-divider, .scrollbar-grimoire, .presence-led-on/off, .focus-grimoire, .card-hover-lift, .card-hero.",
  "PRÉFÈRE migrer vers les vrais composants shadcn (Card, Button, Badge, Input, Separator...) quand c'est naturel. Garde les classes legacy seulement pour le sur-mesure (barres vitaux, big numbers, listes denses).",
  "",
  "## RÈGLE D'OR — ne casse pas l'orchestration",
  "- NE CHANGE JAMAIS les props/signatures exportées des composants (types dans types.ts, noms d'export, paramètres). Change UNIQUEMENT le rendu interne (JSX + classes).",
  "- Préserve TOUS les comportements : onClick, useTransition, useState, server actions, optimistic UI.",
  "- Touche UNIQUEMENT tes fichiers assignés.",
  "- NE COMMIT PAS — l'orchestrateur commit à la fin.",
  "",
  "## Validation",
  "Après ton travail : le code doit être TypeScript-valide (imports résolus, pas de prop inexistante). Pas de classes Tailwind inventées hors tokens ci-dessus.",
].join("\n")

const outSchema = {
  type: 'object',
  properties: {
    filesModified: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string', description: 'Résumé < 250 mots de la migration visuelle' },
    shadcnUsed: { type: 'array', items: { type: 'string' }, description: 'Composants shadcn utilisés' },
    signaturesChanged: { type: 'boolean', description: 'true si tu as dû changer une signature de prop (à éviter)' },
    notes: { type: 'string' },
  },
  required: ['filesModified', 'summary', 'signaturesChanged'],
}

phase('Migration')

const results = await parallel([
  // Agent 1 — Vitaux
  () => agent(SHARED + "\n\n" + [
    "## TA MISSION — Vitaux (barres de vie game→Linear)",
    "Fichiers EXCLUSIFS :",
    "- src/components/character-sheet/VitalBar.tsx",
    "- src/components/character-sheet/VitalsHeader.tsx",
    "- src/components/character-sheet/RecoveryPanel.tsx",
    "",
    "VitalBar : épure la barre vers le style Linear. Retire le gradient/segments/reflet/glow tape-à-l'œil. Garde : barre fine (h-1.5 à h-2) sur bg-muted, fill en couleur sémantique (HP bg-hp, MHP bg-mhp, Endu bg-endu), radius-full. Big number du current en .big-number ou text-4xl tabular + /max en text-muted-foreground. Garde le VitalAdjuster (input + Dégât/Soin) mais en composants shadcn : Input shadcn + Button variant destructive (Dégât) / variant outline avec text-endu (Soin). Mode compact = juste la barre fine + chiffre tabular. Le sigil SVG du vital : garde-le mais en text-muted-foreground discret (h-4 w-4).",
    "RecoveryPanel : Card shadcn. Glyphes CalvaryGlyph/EclipseGlyph en text-ink-tertiary discrets (size 40-48). Boutons Régénérer = Button shadcn. Résultat du jet en bloc bg-muted rounded-md, chiffres tabular.",
    "Garde les signatures (kind/current/max/compact/onAdjust, et les props RecoveryPanel onRecoverHp/onRecoverEndurance).",
  ].join("\n"), { phase: 'Migration', label: 'vitaux', schema: outSchema }),

  // Agent 2 — Skills / Jets
  () => agent(SHARED + "\n\n" + [
    "## TA MISSION — Skills & lanceur de dés",
    "Fichiers EXCLUSIFS :",
    "- src/components/character-sheet/AttributesGrid.tsx",
    "- src/components/character-sheet/SkillRow.tsx",
    "- src/components/character-sheet/PointAllocatorBar.tsx",
    "- src/components/character-sheet/DDDrawer.tsx",
    "",
    "AttributesGrid : 4 Card shadcn (grid 2x2). Header de card = nom attribut (font-semibold tracking-tight text-foreground) + score en .big-number/text-3xl tabular text-primary (cliquable→jet, garde le onOpenRollDrawer). Skills en liste dense dessous.",
    "SkillRow : ligne dense. Nom + valeur tabular + boutons ±1 (Button size-icon variant ghost/outline h-6 w-6) + bouton dé (Button size-icon ghost, icône lucide Dices h-3.5). Hover bg-muted. Garde tooltip via shadcn Tooltip (title→Tooltip) ou garde title=. Garde signatures.",
    "PointAllocatorBar : barre allocation X/80 en shadcn Progress (couleur lavande) + label eyebrow + chiffres tabular. Cap atteint → text-hp.",
    "DDDrawer : MIGRE vers shadcn Sheet (side='right') ! Remplace le backdrop+aside custom par <Sheet open={!!context} onOpenChange>. SheetContent côté droit. Presets DD en boutons (Button variant outline, selected = bg-primary/15 border-primary text-primary-hover). Garde l'API (context/onClose/onRoll). Le contenu : formule 2d6+X en big tabular, grid presets DD, bouton Lancer (Button default lavande).",
    "Garde toutes les signatures de props.",
  ].join("\n"), { phase: 'Migration', label: 'skills+jets', schema: outSchema }),

  // Agent 3 — Évolution / Profil / reste
  () => agent(SHARED + "\n\n" + [
    "## TA MISSION — Évolution, profil, training, présence, actions endu",
    "Fichiers EXCLUSIFS :",
    "- src/components/character-sheet/EvolutionSection.tsx",
    "- src/components/character-sheet/ProfileEditor.tsx",
    "- src/components/character-sheet/TrainingRequestButton.tsx",
    "- src/components/character-sheet/PresenceBadge.tsx",
    "- src/components/character-sheet/EnduranceActionPanel.tsx",
    "",
    "EvolutionSection (MJ) : Card shadcn. AscensionGlyph en text-ink-tertiary discret. Niveau en .big-number text-primary, progression XP en shadcn Progress (lavande), input XP = Input shadcn, boutons trainings = Button. Palier endu en badge.",
    "ProfileEditor : Card shadcn. 3 champs en Input + Label shadcn. Bouton Enregistrer = Button default. Feedback en text-primary.",
    "TrainingRequestButton : Card. Pending → Badge variant outline + texte. Sinon Input note + Button 'Demander'. Garde RelativeTime.",
    "PresenceBadge : ligne avec LED (.presence-led-on/off gardés) + label + Button (Rejoindre=default lavande / Quitter=outline).",
    "EnduranceActionPanel : grille 4x2 d'actions. Chaque action = Button variant outline OU petite Card cliquable, avec nom + sous-titre text-muted-foreground + coût tabular coloré par catégorie (Phy text-endu, Off text-hp, Def text-mhp, Esq text-primary). Hover bg-muted.",
    "Garde toutes les signatures.",
  ].join("\n"), { phase: 'Migration', label: 'évolution+profil', schema: outSchema }),

  // Agent 4 — Orchestrateur CharacterSheet + glyphs
  () => agent(SHARED + "\n\n" + [
    "## TA MISSION — CharacterSheet (orchestrateur layout) + glyphes monochromes",
    "Fichiers EXCLUSIFS :",
    "- src/components/character-sheet/CharacterSheet.tsx",
    "- src/components/character-sheet/index.ts (si besoin)",
    "- src/components/glyphs/*.tsx (les 8 glyphes)",
    "",
    "CharacterSheet : tu réorganises le LAYOUT vers un dashboard Linear dense. Tu IMPORTES les sous-composants (VitalsHeader, AttributesGrid, etc.) — NE CHANGE PAS leurs props (d'autres agents les refondent en interne, l'API reste identique). Layout : grille propre, sections séparées par Separator shadcn ou sigil-divider léger. Header identité : Avatar shadcn (fallback initiales) + nom text-3xl font-semibold tracking-tight + badge rôle. Garde TOUTES les props de CharacterSheet (isMJ, onXxx, drawerCtx state, DDDrawer). Garde le PresenceBadge en tête, EvolutionSection MJ-only, etc. Repense juste l'agencement visuel (moins bento ornemental, plus dashboard Linear dense : colonnes claires, hairlines, respiration mesurée).",
    "Glyphes : passe TOUS les 8 en accent MONOCHROME discret. Retire toute couleur or/lavande hardcodée dans les SVG — ils héritent currentColor (le parent met text-muted-foreground ou text-ink-tertiary). Garde les formes. strokeWidth peut être affiné à 1.2. Ils doivent être sobres, pas tape-à-l'œil (Linear n'a pas d'illustrations criardes).",
    "NE CHANGE PAS les signatures (props size/className/initials des glyphes, props CharacterSheet).",
  ].join("\n"), { phase: 'Migration', label: 'sheet+glyphs', schema: outSchema }),

  // Agent 5 — Plateau
  () => agent(SHARED + "\n\n" + [
    "## TA MISSION — Plateau /plateau (table partagée, dashboard Linear)",
    "Fichiers EXCLUSIFS :",
    "- src/app/plateau/client.tsx",
    "- src/app/plateau/CritOverlay.tsx",
    "",
    "C'est l'écran social, il doit avoir la prestance d'un dashboard Linear (issue list / project view). Layout 3 colonnes dense :",
    "- Roster compagnons (gauche, ~280px) : ScrollArea shadcn ou liste. Chaque joueur présent = ligne dense (.list-portfolio ou Card compacte) : Avatar shadcn (fallback initiale) + nom + LED présence + 3 mini barres horizontales (shadcn Progress fines h-1, couleurs hp/mhp/endu) avec valeurs tabular. Badge 'Niv.' si MJ.",
    "- Hero central (col flex-1) : Card. Dernier jet = nom perso (text-2xl font-semibold) + formule tabular text-muted-foreground + BIG NUMBER du total (.big-number text-primary si réussite, text-hp si échec crit) + breakdown tabular + Badge réussite/échec/DD. Si vide : RoundTableGlyph text-ink-tertiary + texte muted.",
    "- Lanceur (droite, ~320px) : Card. Select perso (shadcn Select), attributs en boutons (Button outline grid 2x2, selected bg-primary/15), skill (Select), chips DD (Button outline), Button 'Lancer' lavande. Section formule libre : Input + Button.",
    "- Carnet des jets (sous le hero, pleine largeur) : Card avec header sticky + ScrollArea. Lignes = .list-portfolio dense : nom perso + formule tabular + total (text-2xl tabular coloré) + Badges. Séparateurs hairline.",
    "Header de page : RoundTableGlyph discret (text-muted-foreground) + titre text-3xl font-semibold tracking-tight + sub 'Session ouverte · X joueurs' + liens nav (Button variant ghost/link).",
    "Polling : conserve setInterval(router.refresh, 5000).",
    "CritOverlay : garde le comportement (détection dernier roll, animations crit-*). Adapte les couleurs : crit succ = lavande/primary glow + texte, crit fail = hp (#e5484d) + shake. Reste plein écran z-50. Sobre mais impactant.",
    "Garde les signatures/props (PlateauClient reçoit characters/initialRolls/etc.).",
  ].join("\n"), { phase: 'Migration', label: 'plateau', schema: outSchema }),

  // Agent 6 — Pages landing/signin/preview/me/mj
  () => agent(SHARED + "\n\n" + [
    "## TA MISSION — Pages : landing, signin, preview, /me, /mj",
    "Fichiers EXCLUSIFS :",
    "- src/app/page.tsx (landing)",
    "- src/app/signin/page.tsx",
    "- src/app/preview/page.tsx",
    "- src/app/me/page.tsx + src/app/me/client.tsx",
    "- src/app/mj/page.tsx + src/app/mj/client.tsx",
    "",
    "Tu NE touches PAS au composant CharacterSheet ni aux sous-composants character-sheet (autres agents). Tu les CONSOMMES via les clients (qui passent les callbacks — garde ces callbacks intacts).",
    "",
    "Landing / : Card shadcn centrée ou 2-col. ConstellationGlyph en text-primary subtil (un seul usage lavande hero ok). Titre FAITH:RE text-6xl font-semibold tracking-tight. Bouton Discord (garde #5865F2 brand) ou Button. Si connecté : nom + Badge rôle + Buttons (Plateau, Ma fiche/MJ, Quitter).",
    "Signin : Card centrée max-w-md. ConstellationGlyph text-primary subtil. Heading + Button Discord brand + note MJ.",
    "Preview : garde le mock + toggle MJ. Aligne le wrapper sur le style Linear (Card, bg-background).",
    "/me page : liste claim en .list-portfolio ou Cards shadcn. Header de page sobre (eyebrow + titre). Le client wrap CharacterSheet (garde les callbacks intacts, change juste le chrome de page : header, nav link Plateau).",
    "/mj page : dashboard. Roster sidebar en .list-portfolio dense (LED + nom + barre HP shadcn Progress + Badge Niv), item actif border-l-primary + bg-muted. PendingTrainingPanel (dans mj/client.tsx) en Card avec liste + Buttons Approuver(default)/Refuser(outline). Le MJCharacterClient wrap CharacterSheet (callbacks intacts).",
    "Tous les backgrounds : retire les bg-[#...] hardcodés, le body est déjà bg-background. Headers en text-foreground, eyebrows en text-muted-foreground uppercase.",
    "Garde signatures/props et tous les callbacks server actions.",
  ].join("\n"), { phase: 'Migration', label: 'pages', schema: outSchema }),
])

const clean = results.filter(Boolean)
const sigChanged = clean.filter(r => r.signaturesChanged)
log('Migration: ' + clean.length + '/6 agents terminés. Signatures changées: ' + sigChanged.length)

return { results: clean }
