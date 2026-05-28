# FAITH : RE — Bot Discord

Process Python séparé qui partage la BDD Neon avec le compagnon web Next.js.

## Setup

```bash
# 1. Installer les dépendances Python
pip install -r requirements.txt

# 2. Configurer l'env
cp .env.example .env
# → remplir DISCORD_TOKEN, DATABASE_URL (même que la web app), MJ_USER_ID

# 3. Lancer
python bot.py
```

## Important

Le bot **n'effectue pas de migration de schema**. Les tables sont créées par
le compagnon web via `pnpm db:push` (Drizzle Kit). Lance d'abord la web app
au moins une fois pour que les tables `character` et `character_skill` existent.

## Commandes

| Commande | Description | MJ only |
|---|---|---|
| `!start-session` | Reset endurance de toute la table | ✓ |
| `!status` | État vital public (HP/MHP visibles, endu masquée) | |
| `!mj-status` | DM le MJ avec endurance révélée | ✓ |
| `!action <perso> <type>` | Déduit l'endurance (privé en DM MJ) | |
| `!regen <perso>` | 1d100, fixe endurance | |
| `!roll <perso> <attr\|skill>` | 2d6 + attribut + skill | |
| `!sheet <perso>` | Fiche (endu masquée hors DM/MJ) | |
| `!xp <perso> <delta>` | Gain XP + level up auto | ✓ |
| `!train <perso> [n]` | Entraînements endurance + palier | ✓ |

**Types d'actions** : `physique`, `off_r`, `off_nr`, `off_c`, `def_r`, `def_nr`, `esq_r`, `esq_nr`.
**Shorthand attributs** : `INT`, `PSY`, `CON`, `MAN`/`MNV`.
