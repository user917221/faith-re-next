# FAITH : RE — Design System

## Direction

**Linear, version table de jeu.** Near-black `#010102`, accent lavande `#5e6ad2` unique, surface ladder + hairlines, Inter, dense software-craft. shadcn/ui est le langage de composants. Une âme sobre se pose par-dessus (matérialité, moments ritualisés) — jamais par de l'ornement décoratif.

## Audience & intent
- **Qui** : MJ + joueurs d'une partie FAITH : RE, desktop/laptop, en session.
- **Verbes** : suivre HP/MHP/Endurance/Flux, jeter les dés (DD), gérer runes/sorts, présence, combat ; MJ : entraînements (Physique/Flux/Technique), combats réels, paliers, roster.
- **Feel** : instrument de précision, dense, rapide (⌘K), discipline Linear.

## Depth strategy
**Surface ladder SANS ombres.** Hiérarchie par teinte + hairlines 1px. Pas de drop-shadow lourd, pas de halo, pas de gradient décoratif. Ring 0 0 0 1px toléré (focus).

## Tokens couleur (shadcn, `:root` + `.dark` dans `globals.css`, dark-only)

### Surfaces (Linear surface ladder)
- `--background` `#010102` — canvas (body)
- `--card` `#0f1011` — surface 1 (cards)
- `--popover` `#141516` — surface 2 (élévation, hover)
- `--secondary`/`--muted` `#18191a` — surface 3 (chips, blocs imbriqués)
- `--surface-4` `#191a1b`

### Accent — lavande UNIQUE (scarce)
- `--primary` `#5e6ad2` · `--primary-hover` `#828fff` · `--primary-focus` `#5e69d1`
- **Règle d'or** : lavande RÉSERVÉE au brand, focus ring, 1 CTA primaire/section, affordances cliquables (scores de jet). JAMAIS décoratif. Tout le reste est gris/ink.

### Ink ladder (texte)
- `--foreground` `#f7f8f8` (primary) · `--ink-muted` `#d0d6e0` · `--muted-foreground`/`--ink-subtle` `#8a8f98` · `--ink-tertiary` `#62666d`

### Hairlines
- `--border` `#23252a` · `--hairline-strong` `#34343a` · `--hairline-tertiary` `#3e3e44`

### Vitaux JDR (désaturés, comme issue-priority tags — fonctionnels, pas déco)
- HP `--hp` `#e5484d` · Mental `--mhp` `#2bb8c4` · Endurance `--endu` `#30a46c`
- **Flux** = gris/blanc « substance » (neutre : `text-foreground`/`bg-muted`/blanc-gris), JAMAIS lavande ni couleur vitale.

## Typographie
- **Inter** partout (`--font-inter`). Titres `font-semibold tracking-tight`. Eyebrow `uppercase tracking-wide text-muted-foreground text-xs`.
- **JetBrains Mono** (`.tabular`) pour TOUS les nombres (HP, scores, jets, jauges, compteurs).
- `.big-number` (mono tabular, clamp 2.5-4.5rem) pour les chiffres hero (vitaux, totaux de jets).
- Plus de Cinzel/serif (legacy grimoire retiré).

## Spacing & radius
- Base 4px. Multiples Tailwind classiques (1,2,3,4,6,8...). Pas de valeurs arbitraires `text-[0.7rem]` etc. → utiliser l'échelle (text-xs/sm/base...).
- Radius : `rounded-lg` (12px, cards) · `rounded-md` (8px, boutons/inputs) · `rounded-sm`. Jamais `rounded-2xl`/`3xl`.

## Composants — shadcn/ui
Langage par défaut : Button, Card, Badge, Input, Label, Select, Separator, Tabs, Tooltip, Progress, ScrollArea, Sheet, Avatar, Dialog, DropdownMenu, Skeleton, Sidebar, Command (⌘K), Sonner (toasts), HoverCard, Resizable, Chart (recharts), Breadcrumb, Empty, Switch.
- **Pas de `<button>`/`<input>`/`<select>`/`<div rounded border>` brut** quand un composant shadcn existe.
- App Shell : `AppShell` (Sidebar persistante + topbar ⌘K) wrappe /me /mj /plateau. `/` et `/signin` hors shell.

## Feedback & moments
- **Sonner** pour toutes les actions (dégât, soin, jet, skill, training, level-up).
- **CritOverlay** plein écran : crit succ = lavande, crit fail = hp.
- Avatars : `@/lib/avatar` (initialsOf + avatarFallbackStyle couleur déterministe désaturée).

## Glyphes
8 SVG dans `src/components/glyphs/` — accent **monochrome discret** (`text-muted-foreground`/`text-ink-tertiary`), petits. Pas de rotation criarde ni lavande (sauf 1 hero signin/landing en primary subtil).

## Classes legacy (alias de compat, réskinnées Linear)
`.card-grimoire` `.btn-grimoire` `.btn-ghost` `.input-grimoire` `.label-grimoire`(=eyebrow) `.list-portfolio` `.big-number` `.tabular` `.sigil-divider` `.scrollbar-grimoire` `.presence-led-on/off` `.focus-grimoire` `.card-hero` `.card-hover-lift` `.select-grimoire`. Les tokens `gold-aged/parchment/ink-near/...` sont des ALIAS pointant vers les valeurs Linear (lavande/ink/surfaces) — fonctionnels, à migrer progressivement vers les tokens shadcn.

## Exceptions documentées
- Bouton Discord : `bg-[#5865F2]` (brand obligatoire) sur `/` et `/signin`.
- Vitaux colorés (hp/mhp/endu) : code couleur fonctionnel légitime, pas une violation de "lavande scarce".

## Checklist d'audit
1. Surface ladder + hairlines, zéro ombre/halo/gradient déco.
2. Lavande scarce (brand/CTA/focus only).
3. Nombres en `.tabular`, titres `tracking-tight`, eyebrows uppercase.
4. Composants shadcn (pas de primitifs bruts).
5. Spacing/radius sur l'échelle (pas d'arbitraire).
6. Glyphes monochromes discrets.
7. Flux neutre gris/blanc (jamais coloré/lavande).
