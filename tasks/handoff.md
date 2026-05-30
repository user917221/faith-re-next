# Handoff — FAITH:RE

> Snapshot d'état (surécrire, pas empiler). Lire en premier à chaque prise de relais.

## État courant — 2026-05-30 · Claude Code (Opus)

### Ce qui vient d'être fait : refonte visuelle complète **v0 sobre + gestes Omen**, poussée sur `master`

Direction validée : design sobre/premium type « v0/Vercel dark », enrichi de gestes signature empruntés au dashboard **Omen** (`../omen`, @omen/web). Accent lavande unique `#5e6ad2` (= --primary), traité comme **signal rare** (jamais déco).

**1. Fiche réelle (`CharacterSheet`, montée par /me /mj /plateau /preview) — entièrement v0 + fonctionnelle :**
- `VitalGauge` (faith/) : jauge arc sobre **contrôlée** (vraies données) + ajusteur dégât/soin câblé serveur + **CountUp** (anim douce des chiffres) + mono slashed-zero.
- `VitalsHeader` : 4 jauges (Santé/Mental/Endurance/Flux) dans dalle « État vital ».
- Header de fiche : carte v0, avatar tuile, badges pilule, **chips d'attributs réels** INT/PSY/CON/MAN.
- **Nav onglets = segmented-pills mono** (Tabs controlled, actif = inversion ink blanc/noir — geste Omen).
- **Compétences = ledger à dot-leaders** (`Encyclopédie ···· 1`, filet pointillé `border-dotted border-white/15`) + allocation + jet conservés.
- Profil : ProfileEditor / RuneInventory / TrainingRequestButton en surfaces v0.
- Récupération + Dépense d'endurance : listes sobres.

**2. Chrome harmonisé (global, propagé partout) :**
- `globals.css` : `.glass` (toutes les `Card`) → panneau v0 quasi-opaque ; fond `body::before` → plat (orbs atténuées) ; tokens `ink-*` remappés sur la triade `foreground-muted/subtle` ; `.label-grimoire` → eyebrow v0 ; `.list-portfolio` → liste v0 ; suppression CSS verre mort (`.glass-strong/.card-grimoire/.card-hero`).
- `/plateau` : **hero number du dernier jet = CountUp mono sobre** (lavande only sur réussite critique) ; 4 états vides `RoundTableGlyph` → icônes lucide ; `CritOverlay` sobre (sigils ✦/⚜ retirés, impact par typo + shake).
- `/mj`, `/me` (claim), accueil, signin, AppShell/AppSidebar, EvolutionSection, DDDrawer : surfaces `bg-card/bg-muted/bg-popover` → panneaux/chips v0, eyebrows mono Omen, gros chiffres → mono sobre, glyphe AscensionGlyph retiré.

**3. Cleanup :** supprimé `VitalRing`, `PresenceBadge`, `VitalBar`, `FluxBar`, `AttributesGrid` (orphelins).

**4. Nouveau :** `components/faith/CountUp.tsx` (compteur rAF easeOutQuart, reduced-motion). `/v0` = page mock publique de référence (faith/CharacterHeader+VitauxTab+… — non utilisée hors /v0).

### Vérifié
- `pnpm build` ✅ vert (TypeScript OK, toutes routes). Câblage testé sur /preview (jauge 125→115, récup +7). DOM inspect : pills inversion-ink mono OK, 24 dot-leaders OK.
- ⚠️ Le **screenshot du Preview MCP timeout** sur cette session (machine chargée) — vérif faite via `preview_inspect` (plus fiable) + build. Le dev server répond (eval OK).
- Build : lancer depuis le dossier `faith-re-next` (cwd). `pnpm -C` casse (worker Tailwind EINVAL via inférence workspace-root). Utiliser `(cd faith-re-next && pnpm build)`.

### Prochaines étapes (différé, non abandonné)
- Étendre la couche Omen au `/plateau` plus loin (ledger du carnet, pills Acte/Stats).
- Dés physiques animés, moteur de combat (initiative/tour → `combatsReal`), sorts jouables (`SPELL_CATEGORIES`), upload portrait (`avatarUrl` existe), bot Discord Python → Neon.
- Specs : `tasks/fiche-omen-design.md`, `tasks/redesign-v2-design.md`, `tasks/soul-and-combat-design.md`.

### Blockers
- Aucun. Build vert, poussé sur master (Vercel déploie depuis master).

### Notes durables
- Token piège : `--accent` vaut `#141516` en dark (`.dark` écrase le `#5e6ad2` de `:root`) → `text-accent`/`bg-accent` = quasi-noir. Pour la lavande, utiliser **`--primary` / `text-primary`** (jamais `text-accent`).
- Dev server géré par Preview MCP (launch.json workspace, nom `faith-re-next`, port 3008). Next 16 = lock mono-serveur.
