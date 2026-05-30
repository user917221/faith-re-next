# Plan — Cockpit MJ FAITH:RE (niveau maquette de référence)

> Objectif : passer de la **fiche polie actuelle** (9.22/10, 1 panneau) au **cockpit MJ complet** de la maquette : shell multi-panneaux, roster live, stats de combat, conditions, quick-roll builder, status notes, campagne/sessions, modules Gear/Bio/Notes/NPCs/Maps/Journal/Rules, GM↔Player view, export PDF.

## 0. Décision préalable (à trancher AVANT de coder)

- [ ] **Palette.** La maquette est **OR/ambre chaud + jauges colorées sémantiques** (HP rouge / Mental cyan / Endurance vert / Flux or). On a convergé vers **v0-sobre lavande + jauges acier désaturées**. Deux options :
  - **A — Pivot chaud** : adopter l'accent or de la réf + rendre les jauges colorées sémantiques. Plus riche, plus « grimoire premium », = la réf à l'identique.
  - **B — Structure réf, base sobre** : garder le langage v0 lavande mais reprendre la **densité / complétude / layout** de la réf.
  - _Reco : A si on veut « ce niveau » au sens visuel ; sinon B. Ça conditionne les tokens de la Phase 1._
- [ ] **Périmètre vue.** La réf est un **cockpit MJ** (GM Mode, roster 6/6, pending training, campaign status). La vue joueur = sous-ensemble filtré (« Player View »). Cible principale = `/mj` (ou nouvelle route `/dashboard`).

## Ce qui existe déjà (la base — ~50 % des briques)
Auth+rôles, DB Neon/Drizzle, `characters` (vitals/xp/entraînements/flux/avatarUrl/présence), `characterSkills` (20), `characterRunes`, `publicRolls` (dd/crit), `trainingRequests`, moteur de jets (`rollPublicSkill/Formula/rollSkillWithDD`), 4 jauges fonctionnelles, récup, actions endurance, roster, `/plateau`, CommandMenu ⌘K, AppShell+Sidebar, polish v0/Omen.

---

## Phase 1 — Shell cockpit & layout (le squelette) · ~2 j ✅ FAIT (2026-05-30, option B sobre)
Le plus gros saut visuel : passer de « sidebar + 1 contenu » à la grille cockpit.
- [x] `CockpitShell` → top bar enrichie : sélecteur de campagne (stub), badge **Mode MJ** (crown, si role=mj), `Session N`, date, ⌘K, avatar.
- [x] Nav-sidebar → nav complète (Dashboard / Roster / Sessions / Journal / Maps / NPCs / Items / Règles / Dés / Réglages) + bloc **Campaign Status** + **Session Timer** en pied.
- [x] Refonte `/mj` : grille 3 panneaux **Roster | Fiche centrale | Jet Rapide** (panes flex `w-72` responsive md/xl — _pas ResizablePanelGroup : différé, fixed-width suffit Phase 1_). Données réelles (RosterNav + PendingTrainingPanel + MJCharacterClient câblé server actions). Banc d'essai public `/cockpit` consomme le même shell (mock).
- [x] Bottom bar : « Sauvegardé », Écran MJ, **Vue joueur**, **Export PDF** (visuels ; toggles câblés Phase 8).
- [x] État sélection : roster → fiche centrale via `<Link href=/mj?id=>` (URL `?id=`, pas `?c=`).
- [x] Build vert (exit 0) + capture Playwright `/cockpit` OK. Commit `8894df0` poussé master.

_Reste en stub (par design, câblés phases ultérieures)_ : sélecteur campagne + Session N/date + Session Timer persistance + Campaign Status (Phase 5) ; toggles bottom bar (Phase 8) ; nav-sidebar non-Dashboard inerte (phases 5-7). `QuickRollPanel` = mock `Math.random` (moteur réel Phase 3).

## Phase 2 — Stats de combat + conditions · ~1.5 j ✅ FAIT (2026-05-30, commit 3ee7edb)
- [x] Schema (`db/schema.ts`) : `initiative`/`armor`/`movement`/`proficiency` sur `character` ; table `condition` (characterId, label, kind: buff/debuff/wound/focus/neutral). `drizzle-kit push` → Neon OK (additif).
- [x] UI bandeau `CombatStatsBanner` (Initiative/Armure/Vitesse/Maîtrise, steppers inline, signés init/maîtrise) + `ConditionsPanel` (chips colorés sémantiques, add inline label+nature, remove ×). Onglet Vitaux, partagé /mj /me /cockpit /preview.
- [x] Server actions `combat.ts` : `updateCombatStats` / `addCondition` / `removeCondition` (assertCanEdit, clamp, revalidate).
- [x] Tags identité (race/pronoms/classe) : colonnes `race`/`pronouns`/`char_class` ; classe en badge or + race/pronoms en sous-titre header ; édition via `ProfileEditor` (updateProfile étendu).

## Phase 3 — Quick Roll panel · ~2 j ✅ FAIT (2026-05-30, commit edded6f)
- [x] `QuickRollPanel` contrôlé (prop `onRoll`) : sélecteur de dé d4…d100, gros display résultat (coloration crit vert/rouge), boutons **Lancer / Avantage**.
- [x] **MODIFICATEURS** : grille +1…+5 / −1…−5 (toggle).
- [x] **POOL DE DÉS** builder : ajouter `dXX × N`, supprimer, **Lancer le pool**.
- [x] Branché sur le feed `/plateau` via nouvelle action `rollPublicPool` (persiste public_roll + revalidate). MJQuickRoll(characterId) dans le pane droit /mj.
- [x] Avantage = keep highest (désavantage keep lowest), prêt côté serveur. Fallback local Math.random pour l'aperçu /cockpit sans BDD.
- _Note : pas de CountUp sur le résultat (snap direct) ; à ajouter au polish Phase 8 si voulu._

## Phase 4 — Skills rank/mod/prog + onglets · ~2 j ✅ FAIT (2026-05-30, commit 5562dbe)
- [x] RANK + MOD + PROG **dérivés des points** (aucun changement schema ni moteur de jets) : `getSkillTier` + `SKILL_TIERS` (Novice 0-1 / Confirmé 2-3 / Expert 4-5 / Maître 6+) dans skills.ts. MOD = attr + comp. (bonus réel au 2d6). PROG = barre de niveau (points/8).
- [x] Légende tiers (`SkillTierLegend`) sous la barre d'allocation.
- [x] `SkillRow` enrichi : MOD + chip de palier coloré + barre de niveau, allocation+jet conservés. Table 2-col par attribut (= structure réelle FAITH:RE, équivalent CORE/SPECIALIST).
- [~] Refonte 6 onglets (GEAR/BIO/NOTES/EFFECTS) **repoussée en Phase 6** (où le contenu existe) pour éviter coquilles vides + re-travail. Onglets actuels Vitaux/Compétences/Évolution/Profil conservés.

## Phase 5 — Campagne / Sessions / Status Notes · ~1.5 j ✅ FAIT (2026-05-30, commit 1def988)
- [x] Schema : `campaign` + `game_session` (NB : `session` réservé Auth.js !) + `status_note`. Push Neon OK. Amorce paresseuse (lib/campaign.ts getCampaignContext) — pas de seed. Vérifié DB (bootstrap « Nuit des Étoiles Filantes » + Session 1).
- [x] Sélecteur de campagne (CampaignSelector : switch/create/advanceSession) + Session N + date. **SessionTimer** live persisté (start/pause via timerStartedAt, pas de write/seconde).
- [x] **CampaignStatus** sidebar éditable (Menace/Moral barres cliquables, Quêtes/Repos steppers) → updateCampaignStatus optimiste.
- [x] **StatusNotesPanel** (pane droit /mj sous Jet Rapide) : add/remove, auteur + horodatage relatif. Actions add/removeStatusNote (MJ ou owner).
- [x] CockpitShell : 3 slots (campaignSelector/campaignStatus/sessionTimer) + fallback stubs pour /cockpit.

## Phase 6 — Modules de contenu des onglets · ~3 j ✅ FAIT (2026-05-30, commit 87397ca)
- [x] **GEAR / ITEMS** : table `item` (name, type arme/armure/objet/consommable, qty, equipped, description) + enum + actions items.ts (add/remove/toggleEquip/updateItemQty) + `ItemInventory` (groupé, qty ±, badge Équipé, suppression) + nouvel onglet **Équipement**. Distinct des runes.
- [x] **BIO** : colonne `bio` + textarea dans ProfileEditor (les tags identité existent déjà P2). Portrait → Phase 8 (Blob).
- [x] **NOTES** : colonne `notes` (joueur) dans ProfileEditor, distincte des status_note MJ (P5).
- [~] **EFFECTS** : les `conditions` (P2) font déjà office d'effets actifs → non recréées (éviter doublon). Enrichissement durée/source = polish futur si besoin.

## Phase 7 — Modules de nav secondaires · ~4 j ✅ FAIT (partiel cadré, 2026-05-30, commit 161a107)
- [x] **Nav fonctionnelle** : `?view=` relatif (marche /mj + /cockpit), CockpitShell `activeView` surligne l'entrée active, Dashboard/Journal/NPCs/Règles = `<Link>`. Shell identique, seul le centre change.
- [x] **Journal** : table `journal_entry` + actions add/remove + `JournalView` (liste chrono + ajout).
- [x] **NPCs** : table `npc` (disposition allié/neutre/hostile) + actions add/remove/updateDisposition + `NpcsView` (cartes + badges cyclables + ajout).
- [x] **Règles** : `RulesView` statique dérivé de skills.ts + faith-system.ts (jets, attributs, paliers, endurance, flux). Pas de BDD.
- [~] **Différé** : Maps (Vercel Blob → Phase 8 avec portrait) ; Roster page dédiée (déjà couverte par la sidebar) ; Sessions historique (table game_session existe, vue légère à faire si besoin).

## Phase 8 — GM↔Player view, Export, portrait, polish final · ~2 j
- [ ] Toggle **GM Mode / Player View** : filtrage data privée (XP/level/notes MJ masqués côté joueur — logique de privacy déjà partielle).
- [ ] **Export PDF** de la fiche (`@react-pdf` ou print CSS).
- [ ] **Upload portrait** (Vercel Blob → `avatarUrl`).
- [ ] **Pending Training inline** dans le roster (accept/reject) — existe en partie sur `/mj`.
- [ ] **Boucle critique multi-agents** (celle qu'on vient de faire) appliquée au cockpit complet → 9.5.

---

## Récap : **8 phases** (+ phase 0 décision)
Effort réaliste : **~3-4 semaines** de dev focalisé (≈ 18 j). Briques existantes ≈ 50 %.
Chemin critique : Phase 1 (shell) débloque tout. Phases 2-5 = data+UI cœur. Phase 7 parallélisable. Phase 8 = finition.

## Quick wins possibles avant le plan complet
- Stats de combat + conditions (Phase 2) = gros gain visuel, peu de data.
- Quick Roll panel (Phase 3) = on a déjà le moteur.
- Le bandeau top + sidebar enrichie (Phase 1 partielle) = l'illusion « app complète » immédiate.
