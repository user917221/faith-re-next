# FAITH : RE — Âme & Moteur de combat (spec brainstorm heavy)

## Direction d'âme : "Disco Elysium jouable, version sobre"
Garder l'ossature Linear (densité, vitesse, ⌘K, hairlines) et y injecter une présence — **par la matérialité et les moments, PAS par du texte bavard**. Pas de "voix de compétences" qui commentent. L'âme se ressent, ne se lit pas.

### Piliers retenus
1. **Matérialité des dés** (levier #1) — le lancer 2d6 a un poids physique.
2. **Moments ritualisés** — crit, level-up (Ascension), mort (Impôt Divin), activation de rune : micro-cinématiques sobres, précises, dramatiques sans kitsch.
3. **Voix typographique** — UN serif à caractère, chirurgical (noms de persos, titres de moments). Inter reste l'os de l'UI. Candidats : Fraunces / Instrument Serif / Spectral.
4. **Ambiance réactive** (plus tard) — HP bas → vignette de danger subtile ; endurance épuisée → l'UI se ternit.
5. **Son toggleable** (plus tard) — dé, crit, nappe d'ambiance. Désactivable par défaut.

### Écarté
- Voix de compétences qui parlent (trop bavard pour la cible).
- Narration IA (la narration reste orale, à la voix du MJ).

## Chantier A — Dés physiques animés (levier #1, priorité)
Remplacer le "chiffre qui apparaît" par un lancer qui **roule et se pose**.

- Composant `<DiceRoll>` : 2 dés (ou N), animation de tumble 2D ~600-800ms (faces qui défilent rapidement → settle sur le résultat avec léger bounce). PAS de three.js/physique 3D (sobre + perf). CSS/JS pur, cohérent Linear.
- Intégration : DDDrawer (jet de skill), plateau (hero), récup, toute action de dé.
- Le résultat final reste la source de vérité serveur (l'anim n'est que la présentation du résultat déjà calculé).
- Respecte `prefers-reduced-motion` → fallback chiffre direct.
- Crit (double 6) / échec (double 1) : les dés se figent + déclenchent le moment ritualisé (CritOverlay existant).

## Chantier B — Moteur de combat léger (initiative + tour)
Jouer un combat depuis l'app, tout au clic. Narration orale.

### Modèle de données (Drizzle / Neon)
- `encounter` : id, name, status ('active'|'ended'), round (int), activeIndex (int), createdBy (userId MJ), createdAt. (Un seul encounter actif à la fois suffit au départ.)
- `combatant` : id, encounterId, characterId (nullable — PNJ sans fiche), name (snapshot), initiative (int), orderIndex (int), currentHp (nullable, pour PNJ), maxHp (nullable), states (jsonb string[] — 'poison','étourdi','marqué'...), isPnj (int 0/1).

### Server Actions (MJ-only sauf consultation)
- createEncounter(name), addCombatant({encounterId, characterId?|name, initiative, hp?}), removeCombatant(id)
- setInitiative(id, value) + tri auto par initiative desc
- nextTurn() (avance activeIndex, incrémente round au tour complet), prevTurn()
- toggleState(combatantId, state), endEncounter()

### UI (panneau MJ + vue plateau lecture seule)
- Tracker : liste ordonnée par initiative, **tour actif highlighté** (border-l-primary + bg-muted), round affiché.
- Chaque ligne : Avatar + nom + initiative (tabular) + mini HP (si applicable) + badges d'états + actions (états, retirer).
- Boutons : "Tour suivant" (primary), "Ajouter combattant" (PNJ rapide : nom + init + hp), "Terminer le combat".
- Ajout des persos présents en 1 clic (pré-remplit depuis le roster).
- Sur le plateau : les joueurs voient l'ordre + qui joue (lecture seule), sans les HP des PNJ (privé MJ).

### Intégration moteur (résolutions au clic)
- Depuis le tracker, "Attaquer" → ouvre le DDDrawer → jet → applique dégâts à la cible sélectionnée (réutilise updateVital).
- États appliqués manuellement (badges), pas d'automatisation de règles complexe (moteur léger).

## File d'exécution (séquentielle, anti-conflit)
1. ⏳ Workflow v2 (App Shell) — EN COURS
2. → Vague QA v2 (4 agents) — préparée
3. → **Chantier A (dés physiques)** + **Voix typo** (fondation âme)
4. → **Chantier B (moteur de combat)** — schema + actions + UI
5. → moments ritualisés (Ascension, Impôt Divin, rune) + ambiance/son (plus tard)

## Garde-fous
- Direction Linear maintenue, âme par touches chirurgicales.
- prefers-reduced-motion respecté.
- Signatures préservées, tsc + build verts.
- Tag `grimoire-v1` = filet.
