# Spec — Fiche /me : couche « Omen mesurée »

> Brainstorm 2026-05-30. Cible : fiche joueur `/me`. Intensité : subset mesuré (proche du v0 actuel).
> Base INCHANGÉE : surfaces v0 (panneaux `rgba(17,19,24,0.98)`), Geist sans/mono, accent lavande `#5e6ad2`, dark. On **ajoute** des gestes signature d'Omen, on ne refait rien.

## ADN Omen emprunté (et ce qu'on écarte)

Pris : surface system + **accent discipline** (l'accent = signal, jamais déco), **nav segmented-pills mono**, **ledger mono à dot-leaders**, **langage data mono + CountUp**, radius pill, ombres quasi-nulles, lucide 14px sw1.8, `letter-spacing:0`.
Écarté (intensité mesurée) : police serif Fraunces, hero number serif italic, grain papier, bento réordonnable (dnd-kit).

## 1. Nav d'onglets → segmented-pills mono
- Remplace les `Tabs` shadcn (soulignement) par un rail pill.
- Conteneur : `inline-flex gap-1 rounded-full border border-border bg-surface-overlay p-1`.
- Items : `rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground-subtle transition-colors`.
- **Actif** : inversion ink `bg-foreground text-background` (geste Omen). _Variante douce possible : `bg-white/[0.06] text-foreground` — à trancher._
- Garde l'accessibilité `role="tablist"` / `aria-selected`.

## 2. Compétences → ledger mono à dot-leaders
- En-tête attribut : `INTELLECT ·········· 5` — nom mono uppercase à gauche, filet pointillé `flex-1 border-b border-dotted border-border/70 translate-y-[-3px]`, score `font-mono tabular-nums slashed-zero` + bouton dé à droite.
- Lignes skills : `Encyclopédie ········ 1` + contrôles −/+ sobres. Même filet pointillé nom→valeur.
- C'est LE graft signature de la fiche (distinctif, zéro dépendance).

## 3. Discipline d'accent (lavande = signal only)
- Lavande UNIQUEMENT sur : focus rings, onglet actif (si variante douce), bouton dé au hover, état « bas » d'une jauge (<25 %), crit/échec.
- Partout ailleurs : achromatique (`foreground` / `foreground-muted` / `foreground-subtle`). Resserrer les usages accent qui traînent.

## 4. Langage data mono + CountUp
- Tous les chiffres (jauges, scores, /max, montants) : `font-mono tabular-nums slashed-zero`.
- Eyebrows de section → mono : `font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-subtle` (au lieu de sans).
- **CountUp** discret sur les valeurs qui changent (PV 125→120 s'anime ~450 ms, easeOutQuart). Respecte `prefers-reduced-motion`.

## 5. Détails Omen transverses
- Ajusteurs / chips en radius pill là où ça a du sens.
- Ombres quasi-nulles (déjà le cas) — séparation par bordure + luminosité.
- Icônes lucide uniformisées 14px `strokeWidth 1.8`.
- (Optionnel) glyphe signature (Constellation) en filigrane ~5 % derrière le header de fiche.

## Fichiers touchés
- `components/character-sheet/CharacterSheet.tsx` — nav pills, header (eyebrows mono, glyphe filigrane optionnel).
- `components/character-sheet/SkillRow.tsx` + section attribut (ledger dot-leaders).
- `components/faith/VitalGauge.tsx` — CountUp + mono/slashed-zero.
- `app/globals.css` — utilitaires `.ui-eyebrow` (mono), `.ledger-row` / filet pointillé.
- NOUVEAU `components/faith/CountUp.tsx` — compteur léger (rAF, easeOutQuart, reduced-motion).

## Vérif
- Banc d'essai `/preview` (public, sans auth) — montrer avant toute propagation vers /mj /plateau.
- `pnpm tsc` + `pnpm build` verts.

## Hors-scope / suite possible
- Étendre la couche à `/plateau` (là, le hero number serif-italic + sparkline Omen auraient tout leur sens).
- Bento réordonnable, grain papier, Fraunces — si on veut monter l'intensité plus tard.
