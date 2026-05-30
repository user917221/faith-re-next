# Handoff — FAITH:RE

> Snapshot d'état (surécrire, pas empiler). Lire en premier à chaque prise de relais.

## État courant — 2026-05-30 · Claude Code (Opus) · ✅ COCKPIT MJ COMPLET (8/8)

> Le `/loop` « fais tout dans l'ordre » est **terminé**. Les 8 phases du cockpit MJ FAITH:RE sont livrées, build vert, poussées sur master (Vercel déploie). Loop arrêté (plus de ScheduleWakeup).

### Les 8 phases (toutes sur master)
1. **P1 shell & layout** (`8894df0`) — `CockpitShell` : nav-sidebar 10 entrées + top bar (campagne/Mode MJ/session/⌘K/avatar) + grille 3 panneaux (Roster | centre | Jet Rapide) + bottom bar. Câblé /mj (vraies données) + /cockpit (mock public).
2. **P2 combat + conditions + identité** (`3ee7edb`) — `CombatStatsBanner` (init/armure/vitesse/maîtrise), `ConditionsPanel` (chips colorés), tags race/pronoms/classe. Table `condition` + `combat.ts`.
3. **P3 Quick Roll réel** (`edded6f`) — `rollPublicPool` (NdS + mod + avantage/keep, crits) → persiste `public_roll` → /plateau. `MJQuickRoll` pane droit.
4. **P4 compétences rang/MOD/palier** (`5562dbe`) — `getSkillTier`/`SKILL_TIERS` (Novice/Confirmé/Expert/Maître) dérivés des points (moteur de jets inchangé), `SkillRow` enrichi + `SkillTierLegend`.
5. **P5 campagne / séances / notes** (`1def988`) — tables `campaign`/`game_session`/`status_note`, amorce paresseuse (lib/campaign.ts), `CampaignSelector` + `CampaignStatus` éditable + `SessionTimer` persisté + `StatusNotesPanel`. CockpitShell 3 slots.
6. **P6 Équipement + Bio + Notes** (`87397ca`) — table `item` + `ItemInventory` + onglet **Équipement** ; colonnes `bio`/`notes` (ProfileEditor).
7. **P7 nav fonctionnelle + Journal/PNJ/Règles** (`161a107`) — nav `?view=` (`activeView`), tables `journal_entry`/`npc` + `world.ts`, vues JournalView/NpcsView/RulesView (Règles statique depuis les constantes).
8. **P8 vue MJ↔joueur + export PDF + portrait** (`a892826`) — `?mode=player` (fiche isMJ=false, Évolution/Niv/notes MJ masqués, badge « Vue joueur »), Export PDF print-CSS (`@media print` + window.print), portrait par URL (ProfileEditor).

### Méthode du loop (référence)
1 phase/itération : schema additif → `pnpm db:push --force` (Neon) → code → build vert (`(cd faith-re-next && pnpm build)`) → capture Playwright (`scripts/shoot-*.py` sur `/cockpit?...` car `/mj` auth-gated) → commit + `git push origin HEAD:master` → MAJ plan+handoff+TaskList → ScheduleWakeup 60s. Branche `codex/dashboard-redesign` poussée sur master à chaque phase.

### Vérifié
- `pnpm build` ✅ exit 0 à chaque phase. Schemas poussés sur Neon (bootstrap campagne vérifié via `scripts/check-campaign.ts`).
- Captures Playwright : cockpit, skills, gear, journal, npcs, regles, player, print — toutes OK, conformes à la maquette.
- Câblage server-actions intact ; fiche /me + /mj 100 % fonctionnelles.

### Note design — pivot chaud (actif)
Cockpit sur le **pivot chaud** (option A) : `.campaign-panel` (brun + liseré or), jauges colorées sémantiques (HP rouge / Mental cyan / Endu vert / Flux or). C'est la direction de la maquette de Corentin.

### Reste / différé (sur demande)
- **Maps** (pins + upload Vercel Blob) — nav inerte. **Upload portrait fichier** (manque `BLOB_READ_WRITE_TOKEN` ; portrait par URL livré). **Roster page dédiée** + **Sessions historique** (vues légères ; données existent). **Boucle critique multi-agents → 9.5** (effort séparé, non lancée). **CountUp** sur le Jet Rapide. **EFFECTS** enrichis (durée/source sur conditions).
- Nav inerte restante (boutons sans `view`) : Roster, Sessions, Maps, Items, Dés, Réglages.

### Blockers
- Aucun. Build vert, tout poussé master (`a892826`), Vercel déploie.

### Note durable
- Token piège : `--accent` = `#141516` en dark → `--primary`/`text-primary` pour la lavande.
- Table `session` réservée Auth.js → la séance de jeu = `game_session`.
- Build depuis `faith-re-next` (`pnpm -C` casse via worker Tailwind EINVAL). `/mj` auth-gated → screenshoter via `/cockpit` (mock, dans PUBLIC_PATHS).
- Specs : `tasks/cockpit-mj-plan.md` (plan 8 phases, tout coché), `fiche-omen-design.md`, `redesign-v2-design.md`, `soul-and-combat-design.md`.

---

### (Archive) Boucle design fiche /me → 9.22/10 (base v0-sobre, pré-pivot chaud)

Méthode : boucle critique→fix→re-score via workflows multi-agents (6 DA notent chaque dimension contre Stripe/Linear/Vercel-v0/Omen, en regardant captures Playwright + code). **Trajectoire : 8.23 → 8.73 → 9.07 → 9.17 → 9.22** (zéro gap HIGH). Accent discipline (boutons ink blanc, lavande = seul signal progression), données mono `tabular-nums slashed-zero`, dot-leaders white/18, header `ConstellationGlyph` filigrane, UI optimiste jauges + `prefers-reduced-motion`, un seul dialecte v0, cleanup code mort. _Plafond ~9.2 = nits sub-pixel ; vrai juge = Corentin._ Ces acquis valent pour la **fiche /me** ; le **cockpit** part sur le pivot chaud Codex (voir ci-dessus).
