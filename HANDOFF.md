# FAITH : RE — Handoff au MJ

> Tu reprends le projet d'un autre dev. Ce fichier te donne tout ce qu'il faut pour être autonome en 15 min.

## TL;DR

- **Stack** : Next.js 16 + Auth.js v5 (Discord OAuth) + Drizzle ORM + Neon (Postgres serverless) + Tailwind 4
- **Hébergement** : Vercel · Repo public sur GitHub
- **URL live** : https://faith-re-next.vercel.app
- **Dev local** : `pnpm install && pnpm dev` (après config `.env.local`)

## Setup local en 5 min

```bash
git clone https://github.com/user917221/faith-re-next.git
cd faith-re-next
pnpm install
cp .env.example .env.local
# Remplir DATABASE_URL, AUTH_SECRET, AUTH_DISCORD_ID, AUTH_DISCORD_SECRET, MJ_DISCORD_ID
pnpm db:push     # crée/sync les tables sur Neon
pnpm db:seed     # idempotent : Brad/Corentin/Mathys/Yazid + 80 skills
pnpm dev         # → http://localhost:3000
```

Si tu ne veux pas créer ton propre Neon/Discord OAuth, demande à Corentin de te partager le `.env.local` actuel.

## Promouvoir un nouveau MJ

L'env var `MJ_DISCORD_ID` accepte une **liste comma-separated** de Discord User IDs. Tout user dont le `providerAccountId` Discord est dans la liste est promu `role = 'mj'` au signup.

Trouver ton Discord ID : Discord → Paramètres → Avancés → Mode développeur ON → clic droit sur ton profil → "Copier l'identifiant utilisateur".

```env
MJ_DISCORD_ID="1327269625867669575,1194658275535368394,TON_NOUVEAU_ID"
```

Set côté Vercel via `vercel env rm MJ_DISCORD_ID production` puis `vercel env add MJ_DISCORD_ID production` → redeploy.

Pour rétro-promouvoir un user déjà signé : exécuter `pnpm tsx --env-file=.env.local src/db/promote-mj.ts` (le script lit MJ_DISCORD_ID et update les role en BDD).

## Architecture

```
src/
  app/
    page.tsx           # landing + auth gate
    signin/            # Discord OAuth flow
    me/                # fiche joueur (privacy ON, XP/level masqué)
    mj/                # dashboard MJ (vue complète + roster sidebar)
    plateau/           # table partagée temps réel (cards joueurs présents + feed dés + lanceur)
    preview/           # demo statique avec mock Brad (sans BDD, utile pour design)
    api/auth/[...nextauth]/route.ts
  proxy.ts             # ex-middleware Next 16 (auth redirect)
  components/
    character-sheet/   # composants fiche : Vitals, Skills, Evolution, Profile, Training, Recovery, DDDrawer, PresenceBadge
  lib/
    auth.ts            # Auth.js v5 + Drizzle adapter + Discord provider + callback role MJ
    faith-system.ts    # CONSTANTES système (XP, LEVEL_BONUS, ENDURANCE_TIERS, ENDURANCE_COSTS)
    skills.ts          # SKILL_GROUPS (4 attrs × 5 skills), SKILL_DESCRIPTIONS, ATTR_SHORTHAND
    load-character.ts  # hydratation server-side (max HP/MHP/Endu calculés)
    actions/           # Server Actions Next : character, recovery, training, profile, presence, plateau (rolls), roll-skill-dd
    discord-webhook.ts # utilitaires push embed Discord (pas encore branché aux actions)
  db/
    schema.ts          # Drizzle : user, character, character_skill, public_roll, training_request, account, session, verificationToken
    seed.ts            # seed roster initial
  middleware.ts (n'existe pas — Next 16 utilise proxy.ts)

bot/                   # Bot Discord Python (psycopg3 + Neon)
  bot.py               # commands !status, !roll, !sheet, !action, !xp, !train, !mj-status (privacy)
  requirements.txt
  .env.example         # DISCORD_TOKEN, DATABASE_URL (même que web), MJ_USER_ID
```

## Système FAITH : RE encodé

- **4 attributs × 5 skills** = 20 skills · cap 80 pts (Disco Elysium style)
  - INTELLECT / PSYCHÉ / CONSTITUTION / MANŒUVRE
- **Score attribut** = SOMME des 5 skills (pas moyenne)
- **HP** = 40 (base) + bonus_level + score CONSTITUTION
- **MHP** = 40 (base) + bonus_level + score PSYCHÉ
- **Endurance max** : palier dérivé du nombre d'**entraînements** (donnée privée MJ)
- **Niveaux XP** : 0 → 500 → 1000 → 2000 → 3000 → 4000 (bonus PV/MHP : +0/+20/+40/+80/+160/+320)
- **Paliers endurance** : 2 entr. (Défaut 250) · 3 (Disciplinée 500) · 5 (Optimisée 750) · 7 (Sur-entraînée 1000) · 10 (Sur-humaine 2000) · 15 (Anomalie 3000)
- **Dés** : 2d6 + attribut (+ skill) · double 6 = crit succ · double 1 = crit fail (overrides DD)
- **DD** : Facile 6, Normal 8, Difficile 11, Héroïque 14, Impossible 18 (custom possible)
- **Récup HP** : `(2d6 + Écaillé) / 2` arrondi inférieur
- **Récup Endurance** : `1d50 / 2` arrondi inférieur

Si tu changes ces constantes, modifie **uniquement** `src/lib/faith-system.ts` et `src/lib/skills.ts` (single source of truth pour web + bot).

## Tâches en attente / TODO

- **Bot Python live** : `bot/bot.py` est prêt mais pas démarré. Pour le lancer : `cd bot && pip install -r requirements.txt && cp .env.example .env && python bot.py`. Le bot partage la BDD Neon avec le web — pas de double config.
- **Webhook Discord temps réel** : `src/lib/discord-webhook.ts` (fonctions `syncCharacterEmbed`, `pushActionLog`, `pushRollResult`) existe mais n'est pas encore appelé depuis les Server Actions. À brancher si tu veux que chaque mutation push aussi sur un canal Discord.
- **Custom domain** : pour remplacer `faith-re-next.vercel.app` par `faith.tondomaine.com`, via Vercel dashboard ou `vercel domains add`.
- **Privacy MJ sur le plateau** : actuellement tous les jets sont publics. Si tu veux un "jet privé MJ" qui n'apparait pas dans le feed, créer un flag `isPrivate` sur `public_roll` + filtre côté plateau.

## Debug

- **Logs runtime Vercel** : `vercel logs --follow` ou via dashboard
- **Neon Studio** (browse BDD) : `pnpm db:studio` ouvre Drizzle Studio en local
- **Reset roster** : `pnpm tsx --env-file=.env.local src/db/seed.ts` est idempotent ; pour vraiment reset c'est `TRUNCATE character CASCADE` via psql
- **Si l'auth se met à JWTSession error** : voir commit `de5f0c3` — proxy.ts doit utiliser le full config `lib/auth.ts` (Drizzle adapter), pas un NextAuth standalone

## Comptes & services à connaître

- **GitHub** : repo public `user917221/faith-re-next`
- **Vercel** : team `corentin's projects` (`team_ddpXs9VehwfT4p3Cu9hkqsJp`), project `faith-re-next` (`prj_ocyOKl3dDSGcg2hNzmCTb1qZu2EI`)
- **Neon** : org `org-winter-mud-73571867`, project `faith-re`, région `aws-eu-west-2` (London)
- **Discord OAuth app** : ID `1509658978458796093` (côté Discord Developer Portal)

Demande à Corentin de te donner les accès collaborateur sur Vercel et le repo si besoin d'autonomie complète.

## Pattern de design

Lis `.interface-design/system.md` (109 lignes) avant tout polish UI. Direction : "grimoire de campagne moderne" — fond nuit absolue, or vieilli, parchemin, Cinzel pour le display, sigils ✦. Pas de cyan SaaS.

---

Si tu veux contribuer : ouvre une PR sur `master`. La CI build Vercel se déclenche sur chaque push.

**Bonne campagne.** ✦
