# FAITH : RE — Compagnon Web (Next.js)

Compagnon de JDR pour la campagne FAITH : RE. Auth via Discord, BDD Postgres serverless (Neon), partagée avec le bot Python.

## Stack

- **Next.js 16** (App Router, Turbopack par défaut)
- **React 19.2**
- **TypeScript 5.9** + **Tailwind 4**
- **Drizzle ORM** + driver `@neondatabase/serverless` → **Neon**
- **Auth.js v5** (NextAuth) avec provider **Discord** + Drizzle adapter

## Architecture

```
src/
  app/
    layout.tsx           # Root layout (Inter + JetBrains Mono, dark)
    page.tsx             # Landing (signin button ou switch /me|/mj selon rôle)
    signin/page.tsx      # Page Discord OAuth signin
    me/page.tsx          # Joueur : voit sa fiche (TODO: composant fiche)
    mj/page.tsx          # MJ : voit toutes les fiches (TODO)
    api/auth/[...nextauth]/route.ts
  proxy.ts               # ex-middleware (renommé v16) : redirect /signin si pas auth
  lib/
    auth.ts              # Auth.js config (Drizzle adapter, callbacks role/discordId)
    faith-system.ts      # XP_THRESHOLDS, LEVEL_BONUS, ENDURANCE_TIERS, calculs dérivés
    skills.ts            # SKILL_GROUPS, SKILL_DESCRIPTIONS, ATTR_SHORTHAND
  db/
    index.ts             # Client Neon + drizzle()
    schema.ts            # Tables : user, account, session, verificationToken, character, character_skill
drizzle/
  0000_*.sql             # Migration initiale (générée par drizzle-kit)
```

## Setup local (10 min)

### 1. Neon (Postgres serverless)

- Crée un compte sur https://console.neon.tech (gratuit).
- Crée un projet `faith-re`.
- Copie la **connection string** (format `postgresql://USER:PASS@HOST.neon.tech/faith_re?sslmode=require`).

### 2. Discord OAuth

- Va sur https://discord.com/developers/applications → New Application.
- Onglet **OAuth2** → Add Redirect → `http://localhost:3000/api/auth/callback/discord`
- Copie `Client ID` et `Client Secret`.
- Active mode développeur Discord → clic droit sur ton profil → Copier l'ID utilisateur (ton ID MJ).

### 3. Variables d'environnement

```bash
cp .env.example .env.local
```

Édite `.env.local` :

```env
DATABASE_URL="postgresql://...@...neon.tech/faith_re?sslmode=require"
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_DISCORD_ID="ton_client_id"
AUTH_DISCORD_SECRET="ton_client_secret"
MJ_DISCORD_ID="ton_user_id_discord"
```

### 4. Initialiser la BDD

```bash
pnpm install
pnpm db:push     # crée toutes les tables sur Neon
```

(Optionnel) Explorer la base :

```bash
pnpm db:studio   # ouvre Drizzle Studio en local
```

### 5. Démarrer

```bash
pnpm dev
```

Va sur http://localhost:3000 → "Connexion Discord" → tu seras redirigé vers `/me` (joueur) ou `/mj` (si ton Discord ID = `MJ_DISCORD_ID`).

## Système FAITH : RE (rappel mécaniques)

- **4 attributs × 5 skills** = 20 skills, **cap 80 pts**
  - **INTELLECT** · **PSYCHÉ** · **CONSTITUTION** · **MANŒUVRE**
- **Score d'attribut** = SOMME des 5 skills (pas moyenne)
- **HP** = 40 (BASE) + bonus_level + CONSTITUTION
- **MHP** = 40 (BASE) + bonus_level + PSYCHÉ
- **Endurance Max** : palier dérivé du nombre d'**entraînements** (donnée privée MJ)
- **Niveaux** : 0 → 500 → 1000 → 2000 → 3000 → 4000 XP (bonus PV/MHP : 0, +20, +40, +80, +160, +320)
- **Paliers endurance** : Défaut (2 entr. → 250), Disciplinée (3 → 500), Optimisée (5 → 750), Sur-entraînée (7 → 1000), Sur-humaine (10 → 2000), Anomalie (15 → 3000)
- **Système de dés** : 2d6 + Attribut + Skill. Double 6 = critique, double 1 = échec critique.

## Reste à faire (prochaines sessions)

- [ ] Composant `<CharacterSheet>` réutilisable (RSC + Client) avec édition skills temps réel
- [ ] Server Actions : updateSkill, updateXp, updateTrainings, applyEnduranceAction, rollDice
- [ ] Roster (MJ) avec liste de tous les persos + sélection
- [ ] Console Discord simulator (peut-être WebSocket pour push live)
- [ ] Bot Python pointe vers Neon (migration sqlite → postgres via DATABASE_URL)
- [ ] Webhook Discord temps réel pour push fiches
- [ ] Seed initial : créer Brad / Corentin / Mathys / Yazid avec ownerUserId nullable (rattachement au login Discord)

## Scripts

| | |
|---|---|
| `pnpm dev` | dev server (Turbopack) |
| `pnpm build` | prod build |
| `pnpm db:generate` | génère migration SQL depuis schema.ts |
| `pnpm db:push` | applique le schema directement (dev) |
| `pnpm db:studio` | UI Drizzle Studio |
