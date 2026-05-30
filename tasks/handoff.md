# Handoff — FAITH:RE

> Snapshot d'état (surécrire, pas empiler). Lire en premier à chaque prise de relais.

## État courant — 2026-05-30 · Claude Code (Opus) · /loop autonome Phases 2-8

> **Loop en cours** : l'utilisateur a lancé `/loop` « fais tout dans l'ordre, appelle-moi quand t'as fini ». J'enchaîne les phases 2→8 du cockpit, 1 phase/itération, build+commit+push à chaque, ScheduleWakeup pour continuer. **✅ Phases 1-4. En cours : Phase 5.**

### Phase 4 — FAIT (`5562dbe`) : compétences rang/MOD/palier
RANK/MOD/PROG dérivés des points (moteur de jets inchangé). `getSkillTier`+`SKILL_TIERS` (Novice/Confirmé/Expert/Maître), `SkillRow` enrichi (MOD + chip palier + barre niveau), `SkillTierLegend`. Refonte 6 onglets repoussée en Phase 6 (éviter coquilles vides).

### Phase 3 — FAIT (`edded6f`) : Quick Roll panel réel
`QuickRollPanel` contrôlé (prop `onRoll`). Nouvelle action `rollPublicPool` (plateau.ts) : dés NdS multiples + modificateur + keep all/highest/lowest (avantage), crits naturels, persiste public_roll → /plateau. `MJQuickRoll(characterId)` câblé dans le pane droit /mj. Fallback local Math.random pour /cockpit (mock sans BDD). Vérifié Playwright (Lancer → d20).

### Phase 2 — FAIT (`3ee7edb`) : stats de combat + conditions + tags identité
Schema additif Neon (initiative/armor/movement/proficiency + race/pronouns/char_class + table `condition`). `CombatStatsBanner` (steppers) + `ConditionsPanel` (chips colorés add/remove) dans l'onglet Vitaux. Actions `combat.ts` (updateCombatStats/addCondition/removeCondition). Identité éditée via ProfileEditor. Rendu conforme maquette.

### Phase 1 du cockpit MJ — FAIT & poussé master (`8894df0`)

Le cockpit MJ a sa **coque complète** (réf : maquette grimoire de Corentin). On est passé de « sidebar + 1 fiche » à la **grille cockpit multi-panneaux**, branchée sur les vraies données.

**Nouveau composant clé : `src/components/cockpit/CockpitShell.tsx`** — chrome réutilisable :
- **Nav-sidebar** (`w-60`, lg:) : logo `CrestGlyph` + 10 entrées NAV (Dashboard/Roster/Sessions/Journal/Maps/NPCs/Items/Règles/Dés/Réglages) + `CampaignStatus` + `SessionTimer` en pied.
- **Top bar** (`h-14`) : sélecteur campagne · badge **Mode MJ** (crown, si `role==="mj"`) · Session N · date · bouton ⌘K (`CommandMenu`) · avatar.
- **Grille 3 panneaux** : `roster` (pane gauche `w-72` md:) | `children` (fiche centrale) | `rollPanel` ?? `QuickRollPanel` (pane droit `w-72` xl:).
- **Bottom bar** (`h-10`) : Sauvegardé · Écran MJ · Vue joueur · Export PDF.
- Props : `{ user, campaignName?, sessionNumber?, sessionDate?, roster, children, rollPanel? }`.

**Câblage :**
- **`/mj`** (`src/app/mj/page.tsx`) : server component, remplace `AppShell` par `CockpitShell`. Vraies données — `roster={<RosterNav/> + <PendingTrainingPanel/>}`, `children=<MJCharacterClient/>` (fiche câblée aux ~20 server actions). Sélection via `<Link href=/mj?id=>`.
- **`/cockpit`** (`src/app/cockpit/page.tsx`) : banc d'essai **public** (mock, dans `PUBLIC_PATHS` du `proxy.ts`) qui consomme le **même** `CockpitShell` — sert à screenshoter le chrome (le `/mj` réel est auth-gated). Roster + fiche mock interactifs (state local).
- Composants frères déjà commités avant (`CampaignStatus`, `SessionTimer`, `QuickRollPanel`) — ce sont des **stubs visuels** câblés en phases ultérieures.

### Vérifié
- `pnpm build` ✅ exit 0. Capture Playwright `/cockpit` OK (chrome complet rendu, conforme à la maquille).
- Build : lancer depuis `faith-re-next` (`(cd faith-re-next && pnpm build)` — cwd se réinitialise ; `pnpm -C` casse via worker Tailwind EINVAL).
- Captures : `python scripts/shoot-cockpit.py` → `.tmp-screens/cockpit.png` (le Preview MCP screenshot timeout sur cette machine ; `preview_inspect`/`preview_eval` marchent).

### Note design — branche `codex/dashboard-redesign` (PIVOT CHAUD actif)
On n'est PAS sur la base v0-sobre lavande de la boucle 9.22 : **Codex a poussé un pivot chaud** (option A de `cockpit-mj-plan.md`) déjà mergé sur master. Tokens en place : `.campaign-panel` (dégradé brun + liseré or `rgba(223,184,117,0.35)`), `.campaign-subpanel`, `.campaign-header-line`, **jauges colorées sémantiques** (HP rouge / Mental cyan / Endu vert / Flux or). C'est la direction de la maquette de Corentin → on garde. (La fiche /me sobre 9.22 reste documentée plus bas, mais le cockpit assume le chaud.)

### Prochaines étapes — Phases 2-8 (`tasks/cockpit-mj-plan.md`)
Phase 1 ✅. Suite, dans l'ordre du chemin critique :
- **Phase 2** (~1.5 j) : stats de combat (`initiative/armor/movement/proficiency` sur `character`) + table `condition` (chips colorés) + tags identité (`bio`). Schema + `drizzle-kit push`.
- **Phase 3** (~2 j) : `QuickRollPanel` réel — brancher le mock `Math.random` sur `rollPublicFormula` (moteur existe) + dice pool + avantage.
- **Phase 4** : skills rank/mod/prog + onglets. **Phase 5** : campagne/sessions/status notes (décâble les stubs top bar + Campaign Status + Session Timer). **Phase 6** : Gear/Bio/Notes/Effects. **Phase 7** (parallélisable, 1 module/agent) : Journal/NPCs/Maps/Rules. **Phase 8** : GM↔Player view + Export PDF + portrait Blob + boucle critique 9.5.

### Blockers
- Aucun. Build vert, poussé master (`8894df0`, Vercel déploie depuis master).

### Note durable
- Token piège : `--accent` = `#141516` en dark → `--primary`/`text-primary` pour la lavande.
- Specs : `tasks/cockpit-mj-plan.md` (plan 8 phases), `fiche-omen-design.md`, `redesign-v2-design.md`, `soul-and-combat-design.md`.

---

### (Archive) Boucle design fiche /me → 9.22/10 (base v0-sobre, pré-pivot chaud)

Méthode : boucle critique→fix→re-score via workflows multi-agents (6 DA notent chaque dimension contre Stripe/Linear/Vercel-v0/Omen, en regardant captures Playwright + code). **Trajectoire : 8.23 → 8.73 → 9.07 → 9.17 → 9.22** (zéro gap HIGH). Accent discipline (boutons ink blanc, lavande = seul signal progression), données mono `tabular-nums slashed-zero`, dot-leaders white/18, header `ConstellationGlyph` filigrane, UI optimiste jauges + `prefers-reduced-motion`, un seul dialecte v0, cleanup code mort. _Plafond ~9.2 = nits sub-pixel ; vrai juge = Corentin._ Ces acquis valent pour la **fiche /me** ; le **cockpit** part sur le pivot chaud Codex (voir ci-dessus).
