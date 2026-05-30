# Handoff — FAITH:RE

> Snapshot d'état (surécrire, pas empiler). Lire en premier à chaque prise de relais.

## État courant — 2026-05-30 · Claude Code (Opus)

### Boucle d'amélioration design « jusqu'à 9.5 » — fiche /me poussée à **9.22/10**

Méthode : boucle critique→fix→re-score via workflows multi-agents (6 DA notent chaque dimension contre la barre Stripe/Linear/Vercel-v0/Omen, en **regardant les captures Playwright** + le code). Captures fiables via `scripts/shoot.py` (Playwright headless sur localhost:3008/preview — le screenshot du Preview MCP timeout sur cette machine).

**Trajectoire : 8.23 → 8.73 → 9.07 → 9.17 → 9.22** (5 mesures, 6 rounds de fix). État final : **toutes dimensions ≥ 9.1, ZÉRO gap HIGH.** craft 9.3 · cohérence 9.2 · typo 9.1 · couleur-accent 9.4 · layout 9.2 · âme 9.1.

Changements de la boucle :
- **Discipline d'accent** (la grosse montée) : boutons primaires → inversion ink BLANC (button.tsx default variant) ; lavande réservée au SEUL signal de progression (barre d'allocation + jauge XP) ; badge MJ neutralisé ; jauges re-palettées en **famille acier cool unique** (fini le multicolore/Flux saturé), assez lumineuses pour que « plein » se lise ; présence en vert muet (plus émeraude).
- **Données mono** : tous les chiffres en Geist Mono `tabular-nums slashed-zero` (vérifié au DOM — le critique confondait Geist Mono/Sans) ; eyebrows mono partout ; `.tabular` aligné slashed-zero.
- **Ledger** : dot-leaders adoucis (white/18), steppers en chips bordées cohérentes jauges↔skills.
- **Header** : signature `ConstellationGlyph` en filigrane d'angle (l'âme), rangée d'attributs en pied pleine largeur, surface plate, p-5.
- **UI optimiste** sur les jauges (snap immédiat + réconciliation `useEffect`), état bas < 25 % → rouge `--hp`, garde `prefers-reduced-motion` (CSS + JS).
- **Un seul dialecte** : `EvolutionSection` réécrit `<Card>`→`<section>` v0 (dernier outlier shadcn) ; tokens gris unifiés (DDDrawer/RuneInventory `text-muted-foreground`→`foreground-*`).
- **Cleanup** : purge du code mort `/v0` + 5 mocks `faith/*Tab`+`CharacterHeader` ; alias grimoire morts retirés de globals.css.

### Vérifié
- `pnpm build` ✅ vert à chaque round. Câblage server-actions intact (la fiche reste 100 % fonctionnelle).
- Build : lancer depuis `faith-re-next` (`(cd faith-re-next && pnpm build)` — le cwd du shell se réinitialise ; `pnpm -C` casse via worker Tailwind EINVAL).
- Captures : `python scripts/shoot.py` (Playwright) → `.tmp-screens/0{1,2,3}-*.png`.

### Note d'honnêteté
Le score plafonne ~9.2 : à zéro gap HIGH, le critique IA circule sur des **nits de cohérence de tokens sub-pixel** (ink ladder à 2 vraies marches, ligne méta identité mono-partielle, vital-flash défini non câblé). Le **vrai juge de « ce que j'attends » = Corentin** (joueur). La fiche est au niveau « indiscernable de Linear/v0 » selon le critique.

### Prochaines étapes possibles (si on veut viser 9.5 strict)
- ink ladder à 3 marches réelles (tier-2 ~#6a6e80 pour les `/max`/captions).
- Câbler `vital-flash` au changement de valeur ; toasts sonner partout (déjà sur /me réel).
- Étendre la couche Omen au `/plateau` (hero number existe déjà), `/mj`.
- Différé : dés animés, moteur de combat, sorts jouables, upload portrait, bot Discord→Neon.

### Blockers
- Aucun. Build vert, poussé sur master (Vercel déploie depuis master).

### Note durable
- Token piège : `--accent` = `#141516` en dark → utiliser `--primary`/`text-primary` pour la lavande.
- Specs : `tasks/fiche-omen-design.md`, `redesign-v2-design.md`, `soul-and-combat-design.md`.
