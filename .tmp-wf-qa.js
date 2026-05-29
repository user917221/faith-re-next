export const meta = {
  name: 'faith-re-linear-qa-polish',
  description: 'Vague 2 — audit + polish craft Linear par zone (4 agents) puis verdict global',
  phases: [
    { title: 'Polish', detail: '4 agents auditent + corrigent chaque zone contre les principes Linear' },
    { title: 'Verdict', detail: '1 agent fait le squint-test global + liste les défauts résiduels' },
  ],
}

const SHARED = [
  "## Contexte — FAITH : RE, vague 2 (QA + polish craft Linear)",
  "",
  "Projet dans C:/Users/newgenprometheus/42/faith-re-next/ — Next.js 16 + React 19 + Tailwind 4 + shadcn/ui.",
  "Le site vient d'être migré vers le système LINEAR (linear.app) avec shadcn. Ta job : AUDITER puis CORRIGER les défauts de craft pour que le rendu soit irréprochable, niveau Linear.",
  "",
  "## Principes Linear à faire respecter (checklist d'audit)",
  "1. SURFACE LADDER sans ombres : hiérarchie par teinte bg-background(#010102)→bg-card(#0f1011)→bg-popover(#141516)→bg-muted(#18191a) + hairlines border-border(#23252a) 1px. AUCUN drop-shadow lourd, halo, gradient décoratif. Si tu vois une ombre/halo/gradient ornemental → retire.",
  "2. ACCENT LAVANDE SCARCE : text-primary/bg-primary (#5e6ad2) UNIQUEMENT sur brand, focus ring, 1 CTA primaire/section. Si le lavande est décoratif/partout → ramène au gris (text-foreground/text-muted-foreground). Le reste de l'UI est monochrome gris.",
  "3. DENSE & TECHNIQUE : spacing mesuré (pas de vide géant), cards rounded-lg 12px + border-border. Aligne les espacements sur 4px.",
  "4. TYPO : Inter. Titres text-2xl/3xl/4xl font-semibold tracking-tight (négatif). Eyebrow uppercase tracking-wide text-muted-foreground text-xs. Nombres en .tabular (font-mono). Si un titre n'a pas tracking-tight, ajoute. Si un nombre n'est pas tabular, corrige.",
  "5. BIG NUMBERS : HP/scores/totaux de jets en .big-number ou text-4xl/5xl tabular. Vérifie qu'ils dominent visuellement.",
  "6. GLYPHES discrets : text-muted-foreground/text-ink-tertiary, petits. Pas de rotation criarde ni lavande (sauf 1 hero). Si un glyphe est trop gros/coloré/animé → calme-le.",
  "7. COMPOSANTS shadcn : vérifie que Button/Card/Badge/Input/Select/Separator/Progress/Tabs/Tooltip/ScrollArea/Sheet/Avatar sont utilisés où c'est naturel (pas de <button>/<input>/<div rounded border> brut réinventé). Si tu vois un élément brut qui devrait être un composant shadcn → migre-le.",
  "",
  "## Tokens utilisables",
  "bg-background/card/popover/muted/secondary · text-foreground/muted-foreground/ink-muted/ink-tertiary · border-border/hairline-strong · text-primary/primary-hover · text-hp(#e5484d)/text-mhp(#2bb8c4)/text-endu(#30a46c) · rounded-lg/md/sm · ring-ring.",
  "Classes legacy OK : .big-number .tabular .list-portfolio .label-grimoire(eyebrow) .card-grimoire .sigil-divider .scrollbar-grimoire .presence-led-on/off .focus-grimoire.",
  "",
  "## Règles",
  "- NE CHANGE PAS les signatures/props des composants ni les comportements (server actions, useTransition, useState, callbacks). Visuel uniquement.",
  "- Touche UNIQUEMENT tes fichiers assignés.",
  "- NE COMMIT PAS.",
  "- Le code doit rester TypeScript-valide (imports résolus, pas de prop inexistante, pas de classe Tailwind inventée).",
  "- Approche : d'abord LIS le fichier, identifie 3-8 défauts concrets vs la checklist, CORRIGE-les. Sois chirurgical, pas de réécriture totale si pas nécessaire.",
].join("\n")

const auditSchema = {
  type: 'object',
  properties: {
    filesModified: { type: 'array', items: { type: 'string' } },
    defectsFound: { type: 'array', items: { type: 'string' }, description: 'Défauts Linear identifiés' },
    fixesApplied: { type: 'array', items: { type: 'string' }, description: 'Corrections appliquées' },
    summary: { type: 'string' },
  },
  required: ['filesModified', 'fixesApplied'],
}

phase('Polish')

const polish = await parallel([
  () => agent(SHARED + "\n\n" + [
    "## TA ZONE — Pages d'entrée : landing, signin, preview",
    "Fichiers EXCLUSIFS : src/app/page.tsx, src/app/signin/page.tsx, src/app/preview/page.tsx",
    "Audit + corrige contre la checklist Linear. Points d'attention : un seul usage lavande hero (le glyphe ou le titre), bouton Discord brand conservé (#5865F2), Cards shadcn, pas de halo/gradient, titre tracking-tight, espacements 4px.",
  ].join("\n"), { phase: 'Polish', label: 'audit:entrée', schema: auditSchema }),

  () => agent(SHARED + "\n\n" + [
    "## TA ZONE — Fiche perso (CharacterSheet + tous les sous-composants character-sheet)",
    "Fichiers EXCLUSIFS : src/components/character-sheet/*.tsx (CharacterSheet, VitalBar, VitalsHeader, RecoveryPanel, AttributesGrid, SkillRow, PointAllocatorBar, DDDrawer, EvolutionSection, ProfileEditor, TrainingRequestButton, PresenceBadge, EnduranceActionPanel)",
    "C'est l'écran le plus regardé. Audit dense : surface ladder cohérente entre toutes les sections, lavande scarce (les scores d'attribut cliquables peuvent être lavande car ce sont les CTA de jet, mais pas tout), big numbers sur vitaux/scores, barres vitaux épurées (pas de gradient/glow), hairlines partout, composants shadcn bien utilisés, glyphes discrets. Vérifie la COHÉRENCE visuelle entre les composants (même radius, même densité, même traitement de hairline) — c'est souvent là que ça pèche après une migration multi-agents.",
  ].join("\n"), { phase: 'Polish', label: 'audit:fiche', schema: auditSchema }),

  () => agent(SHARED + "\n\n" + [
    "## TA ZONE — Dashboards /me et /mj (pages + clients)",
    "Fichiers EXCLUSIFS : src/app/me/page.tsx, src/app/me/client.tsx, src/app/mj/page.tsx, src/app/mj/client.tsx",
    "Tu NE touches PAS aux composants character-sheet (autre agent). Audit du CHROME de page : headers sobres (eyebrow + titre tracking-tight), roster MJ en liste dense Portfolio Overview (hairlines, hover bg-muted + border-l-primary sur l'actif, barre HP shadcn Progress, Badge Niv), liste claim /me propre, PendingTrainingPanel en Card avec Buttons. Nav links discrets (ghost/link). Pas de bg hardcodé. Cohérence avec le reste.",
  ].join("\n"), { phase: 'Polish', label: 'audit:dashboards', schema: auditSchema }),

  () => agent(SHARED + "\n\n" + [
    "## TA ZONE — Plateau",
    "Fichiers EXCLUSIFS : src/app/plateau/client.tsx, src/app/plateau/CritOverlay.tsx",
    "L'écran social — doit avoir la prestance d'une issue-list Linear. Audit : layout 3 colonnes dense et aligné, hero central avec BIG NUMBER du dernier jet qui domine (lavande si réussite, hp si échec crit), roster compagnons en lignes denses (Avatar + LED + mini Progress hp/mhp/endu + valeurs tabular), lanceur compact en composants shadcn (Select, Button), carnet des jets en liste dense scrollable (.scrollbar-grimoire), hairlines partout, accent scarce. CritOverlay sobre mais impactant (lavande succ / hp fail). Vérifie qu'il n'y a pas de scroll horizontal cassé, que les colonnes tiennent.",
  ].join("\n"), { phase: 'Polish', label: 'audit:plateau', schema: auditSchema }),
])

const polishClean = polish.filter(Boolean)
log('Polish: ' + polishClean.length + '/4 zones auditées, ' + polishClean.reduce((n, r) => n + (r.fixesApplied?.length || 0), 0) + ' fixes')

phase('Verdict')

const verdict = await agent(SHARED + "\n\n" + [
  "## TA MISSION — Verdict global (squint test + défauts résiduels)",
  "Tu NE modifies AUCUN fichier. Tu LIS l'ensemble des pages et composants et tu produis un verdict de craft.",
  "Lis : src/app/page.tsx, signin, /me, /mj, /plateau/client.tsx, et 4-5 composants character-sheet représentatifs (CharacterSheet, VitalBar, AttributesGrid, DDDrawer, EvolutionSection).",
  "Pour chacun, applique le SQUINT TEST (hiérarchie lisible ? rien ne crie ?) et la checklist Linear.",
  "Liste les défauts résiduels CONCRETS (fichier + ligne approximative + quoi corriger). Note ce qui est déjà bon.",
  "Donne un score /10 par zone (entrée, fiche, dashboards, plateau) avec justification courte.",
].join("\n"), {
  phase: 'Verdict',
  label: 'verdict',
  schema: {
    type: 'object',
    properties: {
      scores: { type: 'object', additionalProperties: { type: 'number' } },
      residualDefects: { type: 'array', items: { type: 'string' } },
      strengths: { type: 'array', items: { type: 'string' } },
      verdict: { type: 'string' },
    },
    required: ['scores', 'residualDefects', 'verdict'],
  },
})

log('Verdict rendu.')

return { polish: polishClean, verdict }
