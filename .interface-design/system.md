# FAITH : RE — Design System

## Direction

**Grimoire de campagne moderne.** Nuit absolue, or vieilli, parchemin. L'interface doit évoquer un carnet de rituel manuscrit ouvert sur une table de JDR — pas un dashboard SaaS.

## Audience & intent

- **Qui** : MJ + 4 joueurs d'une partie FAITH : RE (Brad, Corentin, Mathys, Yazid). Pendant une session le soir.
- **Verbes** : suivre HP / MHP / Endurance, faire des jets, dépenser de l'endurance, gérer runes/sort, demander des entraînements (joueur) · ajuster XP/level, approuver, vue d'ensemble du roster (MJ).
- **Feel** : mystique, dense mais lisible, signature dorée discrète, tension narrative.

## Tokens couleur (CSS variables — `@theme` dans `globals.css`)

### Surfaces (élévation par teinte)
- `--color-ink-deep` `#0a0a0f` — fond nuit absolue (canvas, body)
- `--color-ink-near` `#131319` — surface +1 (cards principales, inputs hover)
- `--color-ink-far` `#1c1c25` — surface +2 (tablettes d'action, items roster)
- `--color-ink-edge` `#2a2a36` — éléments embossés

### Signature : or vieilli
- `--color-gold-aged` `#caa15a` — accent principal, headlines, focus
- `--color-gold-bright` `#e8c074` — hover, valeur active
- `--color-gold-soft` `#8a6e3e` — bordures, séparateurs
- `--color-gold-deep` `#5d4926` — utilisations très subtiles

### Vitaux sémantiques
- `--color-blood-dried` `#b35a5a` — HP / actions offensives
- `--color-amethyst` `#9b7fd0` — Mental (MHP) / actions défensives
- `--color-celadon` `#8eb091` — Endurance / actions physiques

### Parchemin (texte, 4 niveaux)
- `--color-parchment` `#ece1c4` — primary
- `--color-parchment-dim` `#aea087` — secondary
- `--color-parchment-mute` `#6e6555` — tertiary / metadata
- `--color-parchment-faint` `#4a4339` — placeholder / disabled

## Typographie

Trois familles, toutes via `next/font` :

- `--font-display` = **Cinzel** (serif display) — sections-titres, labels caps, nom des attributs, valeurs accent
- `--font-sans` = **Inter** — body, defaults
- `--font-mono` = **JetBrains Mono** + `font-variant-numeric: tabular-nums` (utilitaire `.tabular`) — TOUS les chiffres vitaux (HP, MHP, Endurance, XP, scores d'attribut, costs)

## Spacing

Base `--spacing: 0.25rem` (4px). Utiliser les multiples Tailwind classiques (1, 2, 3, 5, 6, 8, 10, 12) sans valeurs arbitraires.

## Radius

- `--radius-xs` 2px (badges micro, pills "Niv.", inline code)
- `--radius-sm` 4px (boutons, inputs)
- `--radius-md` 6px (sub-cards, items roster compacts)
- `--radius-lg` 10px (cards principales)
- `--radius-xl` 14px (modals)

Jamais `rounded-2xl` ni `rounded-3xl` — trop tendre, dilue le côté grimoire.

## Depth strategy

**Borders-only** avec couture dorée fine. Pas de shadows lourdes. La hiérarchie émerge par :
- Teinte de surface (ink-deep → near → far)
- Bordures dorées subtiles (8% à 30% opacity selon l'importance)
- Couture dorée discrète sur `.card-grimoire` (pseudo-element `::before` avec mask gradient haut)

Exception : item actif du roster MJ → glow doré diffus `shadow-[0_0_22px_-8px_rgba(202,161,90,0.4)]`.

## Composants utilitaires (CSS dans `globals.css`)

| Classe | Usage |
|---|---|
| `.card-grimoire` | Card de section : ink-near + bord or 12% + couture top, padding 1.25rem, rayon lg |
| `.label-grimoire` | Label de section : Cinzel small caps doré 0.7rem tracking 0.18em |
| `.btn-grimoire` | Bouton primaire signature : gradient or vieilli, texte ink-deep, Cinzel small caps |
| `.btn-ghost` | Bouton secondaire : transparent, border or 18%, texte parchment-dim |
| `.input-grimoire` | Input parchemin : fond ink-deep inset, border or fine, focus or 50% |
| `.sigil-divider` | Séparateur or avec sigil central (`✦` `✧` `⚜`) entre sections, traits dégradés |
| `.tabular` | font-mono + tabular-nums (TOUS les chiffres vitaux) |
| `.sigil-glow` | Animation pulse 3.2s opacity 0.55 → 0.9 (sigils MJ) |

## Signature : sigils

- `✦` — section principale (vitals, profile, allocation)
- `✧` — sub-section / progression (endurance actions, training, level)
- `⚜` — autorité / héraldique (attributs, MJ-only sections)

Utilisés dans `.sigil-divider` (séparateurs entre sections) et inline dans certains labels.

**Pas d'emojis modernes décoratifs** (🎲 🎯 📈 ⚡ ...) — ils cassent l'ambiance. Garder les emojis fonctionnels (📊 dans !status Discord, etc.) côté bot uniquement.

## Patterns à respecter

1. Toute section principale → `.card-grimoire` + `.label-grimoire` en header.
2. Tout chiffre vital → `.tabular` + couleur sémantique.
3. Tout titre/label → `font-display` (Cinzel).
4. Tout bouton primaire d'action → `.btn-grimoire`. Tout bouton secondaire/dismiss → `.btn-ghost`.
5. Hiérarchie de texte : `text-parchment` (primary) → `text-parchment-dim` (secondary) → `text-parchment-mute` (tertiary). JAMAIS de `text-white/{60,40,...}`.
6. Couture dorée entre sections : `<SigilDivider mark="✦" />` (sous-composant inline dans `CharacterSheet.tsx`).
7. États interactifs : hover ↑ teinte or 10–15%, active scale-[0.98], focus border or 50%. Animation 0.15s ease.

## Exceptions documentées

- Bouton "Connexion Discord" sur `/` et `/signin` conserve `bg-[#5865F2]` + `text-white` — identité de marque Discord obligatoire pour la reconnaissance.
- Page `/preview` montre un mock — mêmes patterns que `/me` mais sans BDD.

## Background grain

Le body porte un grain SVG noise (turbulence fractalNoise) en `mix-blend-mode: overlay` à 3.5% opacity, en `::before` fixed. Toutes les pages `main` doivent avoir `relative z-[2]` pour passer au-dessus du grain.
