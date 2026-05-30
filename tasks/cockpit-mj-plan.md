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

## Phase 1 — Shell cockpit & layout (le squelette) · ~2 j
Le plus gros saut visuel : passer de « sidebar + 1 contenu » à la grille cockpit.
- [ ] `AppShell` → top bar enrichie : sélecteur de campagne, badge **GM Mode** (crown), `Session N`, date, ⌘K, avatar.
- [ ] `AppSidebar` → nav complète (Dashboard / Roster / Sessions / Journal / Maps / NPCs / Items / Rules / Dice / Settings) + bloc **Campaign Status** + **Session Timer** en pied.
- [ ] Nouvelle route `/dashboard` (ou refonte `/mj`) : grille 3 colonnes responsive **Roster | Fiche centrale | Roll panel** (`ResizablePanelGroup` déjà dispo).
- [ ] Bottom bar : « Last saved », GM Screen, **Player View** (toggle), **Export PDF**.
- [ ] État sélection : cliquer un perso du roster → charge le panneau central (state + URL `?c=<id>`).
- [ ] Build vert + capture Playwright.

## Phase 2 — Stats de combat + conditions · ~1.5 j
- [ ] Schema (`db/schema.ts`) : ajouter `initiative`, `armor`, `movement`, `proficiency` (ou dérivés) sur `character` ; nouvelle table `condition` (characterId, label, kind: focused/wounded/buff/debuff/flux, color). `drizzle-kit push`.
- [ ] UI bandeau stats (INITIATIVE / ARMOR / MOVEMENT / PROFICIENCY) + **panneau CONDITIONS** (chips colorés, add via popover, remove).
- [ ] Server actions `addCondition` / `removeCondition` / `updateCombatStats` + `revalidatePath`.
- [ ] Tags identité (race, pronouns, rôle, classe « Chronicle Adept », Player) : champs `bio` sur character.

## Phase 3 — Quick Roll panel · ~2 j (gros morceau interactif)
- [ ] Composant `QuickRollPanel` : sélecteur de dé (d4…d100), gros display résultat (réutiliser `CountUp`), boutons **Roll / Advantage**.
- [ ] **MODIFIERS** : grille +1…+5 / −1…−5 (toggle cumulatif).
- [ ] **DICE POOL builder** : ajouter `dXX × N`, supprimer, Clear, **Roll Pool** → construit une formule → moteur existant (`rollPublicFormula`).
- [ ] Brancher sur le carnet/feed `/plateau` (les jets s'y affichent déjà).
- [ ] Avantage/désavantage = 2 jets, garder le meilleur/pire.

## Phase 4 — Skills rank/mod/prog + onglets · ~2 j
- [ ] Modèle skills : exposer **RANK (0-6)** + **MOD (+N dérivé)** + **PROG (%)**. Adapter `characterSkills` (ajouter `progress`/`mod` ou dériver).
- [ ] Split **CORE / SPECIALIST** + légende tiers (Novice 0-1 / Trained 2-3 / Expert 4-5 / Master 6+).
- [ ] Tabs `SKILLS / EVOLUTION / GEAR / BIO / NOTES / EFFECTS` (coquilles ; Skills+Evolution branchés, le reste = Phase 6).
- [ ] Table skills 2-colonnes avec barre PROG + icône par skill.

## Phase 5 — Campagne / Sessions / Status Notes · ~1.5 j
- [ ] Schema : `campaign` (name, threatLevel, partyMorale, questsActive, downtime), `session` (campaignId, number, date, elapsedSeconds), `status_note` (characterId, text, authorId, createdAt). Push.
- [ ] Sélecteur de campagne (top bar) + Session N + date + **Session Timer** live (start/pause, persisté).
- [ ] **Campaign Status** (sidebar) : Threat Level / Party Morale (barres), Quests Active, Downtime.
- [ ] **STATUS NOTES** (panneau droit fiche) : add/edit, auteur + horodatage relatif.

## Phase 6 — Modules de contenu des onglets · ~3 j
- [ ] **GEAR / ITEMS** : table `item` (characterId, name, type, qty, equipped, description) + UI inventaire (liste + équipé). _Distinct des runes._
- [ ] **BIO** : éditeur tags + texte libre + portrait.
- [ ] **NOTES** : notes perso (joueur) vs status notes (MJ).
- [ ] **EFFECTS** : effets actifs (durée, source) — réutilise `condition` enrichi.

## Phase 7 — Modules de nav secondaires · ~4 j (volumineux, parallélisable)
- [ ] **Journal** (`session_log`/entries par session). **NPCs** (table + fiches légères). **Maps** (upload + pins, Vercel Blob). **Rules** (markdown statique/MDX). **Roster** (page dédiée). **Sessions** (historique + planif).
- [ ] _Chaque module = table + route + UI ; candidat idéal à un workflow multi-agents (1 module/agent)._

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
