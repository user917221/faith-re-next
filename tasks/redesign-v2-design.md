# FAITH : RE — Redesign v2 (App Shell + expérience de table)

> Objectif : passer d'un bon dashboard Linear à une **expérience de table de jeu exceptionnelle**. Desktop/laptop pour tous. Système de design : Linear (near-black #010102, lavande #5e6ad2 accent unique, hairlines, Inter) + shadcn/ui.

## Contexte d'usage validé
- **Device** : desktop/laptop pour MJ ET joueurs → on peut densifier, multi-panneaux, sidebar large.
- **Les 4 chantiers sont validés.**

## Chantier 1 — App Shell (fondation structurelle)
Transformer les pages-îlots en vraie application.

- **`AppShell`** (client) : `SidebarProvider` + `AppSidebar` + zone main. Importé par /me, /mj, /plateau. Reçoit `{ user: { name, role, image }, active }` en props (la page server fait `auth()` et passe l'info).
- **`AppSidebar`** : 
  - Header : wordmark FAITH:RE + glyphe discret
  - Nav principale (lucide icons) : Plateau (`/plateau`), Ma fiche (`/me`), Tableau MJ (`/mj`, role mj only)
  - Footer : Avatar user + nom + rôle + bouton déconnexion (dropdown)
  - Collapsible (rail) — shadcn Sidebar natif
- **`CommandMenu`** (⌘K, `Command` + `Dialog`) : navigation rapide + actions (Lancer un jet, Aller au plateau, Ma fiche, MJ, Déconnexion). Monté global.
- **Layout racine** : `TooltipProvider` + `<Toaster />` (sonner) montés globalement.
- `/` (landing) et `/signin` restent HORS shell (pleine page).
- Pas de route group / git mv — chaque page protégée wrap son contenu dans `<AppShell>`.

## Chantier 2 — Fiche repensée (/me + CharacterSheet)
- **`Tabs`** : Vitaux · Compétences · Évolution · Profil (au lieu d'une longue scroll). Vitaux = onglet par défaut.
- **`Sonner`** : toast sur chaque action (dégât appliqué, soin, jet, skill +1, training demandé). Remplace les feedbacks inline.
- **`Tooltip`** : descriptions de skills au survol (TooltipProvider monté).
- **`Hover Card`** : preview synthétique du perso.
- Header de fiche : Avatar + nom + Badge rôle/niveau.

## Chantier 3 — Plateau cinématique (/plateau)
- **`Resizable`** : 3 panneaux ajustables (roster | scène | lanceur).
- **`Chart`** (recharts) : courbe d'XP de campagne / histogramme des jets récents (panneau MJ ou pied de page).
- **`Sonner`** : toast en direct quand un jet tombe (ex. "Brad — 17 vs DD 14 ✓"). Couplé au polling.
- **`Avatar`** : portraits dans le roster.
- Hero central : big-number du dernier jet conservé, magnifié.
- CritOverlay conservé.

## Chantier 4 — Identité / Assets
- **`Avatar`** partout (roster, fiche, plateau, sidebar footer) : portrait si `character.avatarUrl`, sinon fallback initiales sur fond déterministe (couleur dérivée du nom).
- Schema : ajouter `characters.avatarUrl` (text nullable). Upload = bonus futur (champ dans ProfileEditor).
- **`Empty`** states soignés (pas de perso, table vide, feed vide).
- Iconographie **lucide** cohérente partout (h-4/h-5).
- Glyphes existants : conservés en accent monochrome discret.

## Ordre d'exécution
1. **Fondation (manuel)** : providers layout + AppShell + AppSidebar + CommandMenu + schema avatarUrl. Build vert.
2. **Workflow (agents //)** : intégrer le shell dans /me /mj /plateau + chantiers 2/3/4 par zone.
3. Valider tsc + build, tester sur localhost:3009, commit, deploy.

## Garde-fous
- Direction Linear maintenue (surface ladder, lavande scarce, hairlines).
- Signatures de composants préservées.
- tsc + build verts à chaque étape.
- Tag `grimoire-v1` reste le filet de sécurité.
