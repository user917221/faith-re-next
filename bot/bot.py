"""
FAITH : RE — Bot Discord.

Partage la BDD Neon avec le compagnon web Next.js (schéma Drizzle, tables
`character` et `character_skill`). Le bot n'effectue PAS de migration : c'est
le frontend Next.js (via `pnpm db:push`) qui possède le schema.

Le bot lit/écrit directement la même base : DATABASE_URL identique.

Commandes :
  !start-session                  — reset endurance de toute la table au max
  !status                         — état public (HP/MHP visibles, endu masquée)
  !mj-status                      — DM le MJ avec l'endurance révélée (MJ only)
  !action <perso> <type>          — déduit l'endurance (privé, log MJ en DM)
  !regen <perso>                  — 1d100, fixe l'endurance au résultat
  !roll  <perso> <attr|skill>     — 2d6 + attribut (+ skill), crit 12 / échec 2
  !sheet <perso>                  — fiche publique (endu masquée hors DM/MJ)
  !xp    <perso> <delta>          — gain XP, level up auto (MJ only)
  !train <perso> [count=1]        — entraînement endurance + palier (MJ only)
"""

from __future__ import annotations

import os
import random
import discord
from discord.ext import commands
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row

# --- Env ---
load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")
MJ_USER_ID = int(os.getenv("MJ_USER_ID", "0") or 0)

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL non configurée — copier .env.example en .env")

# --- Bot Discord ---
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)


# --- Constantes système FAITH : RE (synchro avec src/lib/faith-system.ts) ---
BASE_HP = 40
BASE_MHP = 40
DEFAULT_MAX_ENDURANCE = 250
SKILL_CAP = 80

XP_THRESHOLDS = [0, 500, 1000, 2000, 3000, 4000]
LEVEL_BONUS = [0, 20, 40, 80, 160, 320]

ENDURANCE_TIERS = [
    (15, 3000, "Anomalie"),
    (10, 2000, "Sur-humaine"),
    (7,  1000, "Sur-entraînée"),
    (5,  750,  "Optimisée"),
    (3,  500,  "Disciplinée"),
    (2,  250,  "Défaut"),
]

SKILL_GROUPS = {
    "INTELLECT":    ["Encyclopédie", "Logique", "Rhétorique", "Drame", "Conceptualisation"],
    "PSYCHÉ":       ["Sang-Froid", "Divination", "Empathie", "Autorité", "Suggestion"],
    "CONSTITUTION": ["Résilience", "Volonté", "Inflexibilité", "Écaillé", "Sixième Sens"],
    "MANŒUVRE":     ["Coordination Main/Œil", "Savoir-Faire", "Puissance", "Vitesse de Réaction", "Perception"],
}

ATTR_SHORTHAND = {
    "INT": "INTELLECT",
    "PSY": "PSYCHÉ",
    "CON": "CONSTITUTION",
    "MAN": "MANŒUVRE",
    "MNV": "MANŒUVRE",
}


# --- Calculs dérivés ---
def calculate_level(xp: int) -> int:
    for i in range(len(XP_THRESHOLDS) - 1, -1, -1):
        if (xp or 0) >= XP_THRESHOLDS[i]:
            return i
    return 0


def get_level_bonus(level: int) -> int:
    return LEVEL_BONUS[max(0, min(level, len(LEVEL_BONUS) - 1))]


def get_endurance_tier(trainings: int) -> tuple[int, str]:
    for req, mx, label in ENDURANCE_TIERS:
        if (trainings or 0) >= req:
            return mx, label
    return DEFAULT_MAX_ENDURANCE, "Initiale"


def calculate_attribute(skills: dict[str, int], attribute_name: str) -> int:
    return sum(skills.get(sk, 0) for sk in SKILL_GROUPS.get(attribute_name, []))


# --- Connexion BDD (Neon) ---
def get_conn():
    """Ouvre une connexion Neon. Utiliser dans un `with`."""
    return psycopg.connect(DATABASE_URL, row_factory=dict_row, autocommit=False)


def get_character_sheet(char_id: str) -> dict | None:
    """Charge une fiche complète depuis Neon. char_id est un UUID (text)."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM "character" WHERE id = %s', (char_id,))
            char = cur.fetchone()
            if not char:
                return None
            cur.execute(
                'SELECT skill_name, points FROM "character_skill" WHERE character_id = %s',
                (char_id,),
            )
            skills_rows = cur.fetchall()

    skills = {row["skill_name"]: row["points"] for row in skills_rows}
    attributes = {attr: calculate_attribute(skills, attr) for attr in SKILL_GROUPS}

    xp = char.get("xp", 0)
    level = calculate_level(xp)
    bonus = get_level_bonus(level)
    max_hp = BASE_HP + bonus + attributes["CONSTITUTION"]
    max_mental = BASE_MHP + bonus + attributes["PSYCHÉ"]
    max_endurance, endurance_label = get_endurance_tier(char.get("endurance_trainings", 0))

    # runes en jsonb (list[str]) ou string fallback
    runes_raw = char.get("runes") or []
    runes = runes_raw if isinstance(runes_raw, list) else []

    return {
        "id": char["id"],
        "name": char["name"],
        "nom": char.get("nom") or "",
        "age": char.get("age") or 25,
        "xp": xp,
        "level": level,
        "endurance_trainings": char.get("endurance_trainings", 0),
        "endurance_label": endurance_label,
        "current_endurance": char["current_endurance"],
        "max_endurance": max_endurance,
        "current_hp": char["current_hp"],
        "max_hp": max_hp,
        "current_mental": char["current_mental"],
        "max_mental": max_mental,
        "fate_points": char["fate_points"],
        "runes": [r for r in runes if r],
        "skills": skills,
        "attributes": attributes,
    }


def fetch_chars_basic() -> list[dict]:
    """Liste tous les persos (champs courants) pour les commandes batch."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id, name, nom, current_endurance FROM "character" ORDER BY name'
            )
            return cur.fetchall()


def find_char_by_name(name: str) -> dict | None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id, name, nom FROM "character" WHERE LOWER(name) = LOWER(%s) LIMIT 1',
                (name,),
            )
            return cur.fetchone()


def display_name(d: dict) -> str:
    return f"{d.get('name', '')} {d.get('nom') or ''}".strip()


def _is_mj(ctx) -> bool:
    if MJ_USER_ID and ctx.author.id == MJ_USER_ID:
        return True
    perms = getattr(ctx.author, "guild_permissions", None)
    return bool(perms and perms.manage_guild)


# --- 1. Commandes session ---


@bot.event
async def on_ready():
    print(f"Bot connecté en tant que {bot.user.name}")
    print(f"DB : {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else '<configuré>'}")
    await bot.change_presence(activity=discord.Game("FAITH : RE RPG"))


@bot.command(name="start-session")
async def start_session(ctx):
    """Réinitialise l'endurance de tous les joueurs au max (en respectant le palier)."""
    if not _is_mj(ctx):
        await ctx.message.add_reaction("🚫")
        return

    # Reset = max_endurance courant (qui est dérivé du palier d'entraînements)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT id, endurance_trainings FROM "character"')
            rows = cur.fetchall()
            for row in rows:
                mx, _ = get_endurance_tier(row.get("endurance_trainings", 0))
                cur.execute(
                    'UPDATE "character" SET current_endurance = %s WHERE id = %s',
                    (mx, row["id"]),
                )
            conn.commit()

    embed = discord.Embed(
        title="⚡ Nouvelle Session Démarrée",
        description="Toutes les jauges d'endurance de la table ont été réinitialisées à leur maximum !\n\n*Préparez-vous à payer l'Impôt Divin.*",
        color=discord.Color.green(),
    )
    embed.set_footer(text="FAITH : RE Companion")
    await ctx.send(embed=embed)


@bot.command(name="status")
async def status(ctx):
    """État vital public — HP/MHP visibles, endurance masquée (donnée privée MJ)."""
    chars = fetch_chars_basic()
    embed = discord.Embed(
        title="📊 Statut de la Session",
        description="État vital des explorateurs (endurance privée MJ via `!mj-status`).",
        color=discord.Color.blue(),
    )
    for row in chars:
        sheet = get_character_sheet(row["id"])
        if not sheet:
            continue
        hp, max_hp = sheet["current_hp"], sheet["max_hp"]
        mental, max_mental = sheet["current_mental"], sheet["max_mental"]
        hp_bars = round((hp / max_hp) * 10) if max_hp else 0
        mhp_bars = round((mental / max_mental) * 10) if max_mental else 0
        hp_bar = "█" * hp_bars + "░" * (10 - hp_bars)
        mhp_bar = "█" * mhp_bars + "░" * (10 - mhp_bars)
        value = (
            f"❤️ HP `[{hp_bar}] {hp}/{max_hp}`\n"
            f"🧠 MHP `[{mhp_bar}] {mental}/{max_mental}`"
        )
        embed.add_field(
            name=f"👤 {display_name(row)} (Niv. {sheet['level']})",
            value=value,
            inline=False,
        )
    await ctx.send(embed=embed)


@bot.command(name="mj-status")
async def mj_status(ctx):
    """[MJ] Statut complet avec endurance — envoyé en DM."""
    if not _is_mj(ctx):
        await ctx.message.add_reaction("🚫")
        return

    chars = fetch_chars_basic()
    embed = discord.Embed(
        title="🔒 MJ — Statut complet (endurance révélée)",
        description="Données privées : ne pas partager au canal public.",
        color=discord.Color.dark_purple(),
    )
    for row in chars:
        sheet = get_character_sheet(row["id"])
        if not sheet:
            continue
        cur_endu, max_endu = sheet["current_endurance"], sheet["max_endurance"]
        bars = round((cur_endu / max_endu) * 10) if max_endu else 0
        bar = "█" * bars + "░" * (10 - bars)
        value = (
            f"`[{bar}] {cur_endu}/{max_endu}` ({sheet['endurance_label']})\n"
            f"HP `{sheet['current_hp']}/{sheet['max_hp']}` · "
            f"MHP `{sheet['current_mental']}/{sheet['max_mental']}` · "
            f"XP {sheet['xp']}"
        )
        embed.add_field(
            name=f"👤 {display_name(sheet)} (Niv. {sheet['level']})",
            value=value,
            inline=False,
        )

    try:
        await ctx.author.send(embed=embed)
        await ctx.message.add_reaction("📬")
    except discord.Forbidden:
        await ctx.send(
            "⚠️ Impossible de t'envoyer un DM — vérifie tes paramètres de confidentialité.",
            delete_after=10,
        )


# --- 2. Actions endurance ---

COSTS = {
    "physique": ("Action Physique", 10),
    "off_r":    ("Offensive (Réussie)", 20),
    "off_nr":   ("Offensive (Ratée)", 30),
    "off_c":    ("Offensive (Contrée)", 40),
    "def_r":    ("Défensive (Réussie)", 10),
    "def_nr":   ("Défensive (Ratée)", 20),
    "esq_r":    ("Esquive (Réussie)", 5),
    "esq_nr":   ("Esquive (Ratée)", 10),
}


@bot.command(name="action")
async def action(ctx, char_name: str, action_type: str):
    """Déduit l'endurance d'un perso. Endurance restante masquée publiquement."""
    action_type = action_type.lower()
    if action_type not in COSTS:
        valid = ", ".join(f"`{k}`" for k in COSTS.keys())
        await ctx.send(f"❌ Action invalide. Choix valides : {valid}")
        return

    char = find_char_by_name(char_name)
    if not char:
        await ctx.send(f"❌ Personnage **{char_name}** introuvable.")
        return

    sheet = get_character_sheet(char["id"])
    if not sheet:
        return
    label, cost = COSTS[action_type]
    new_endu = max(0, sheet["current_endurance"] - cost)

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE "character" SET current_endurance = %s WHERE id = %s',
                (new_endu, char["id"]),
            )
            conn.commit()

    full_name = display_name(char)

    # Public : action + coût, endu restante masquée
    embed = discord.Embed(
        title="💥 Dépense d'Endurance",
        description=f"**{full_name}** a effectué une **{label}** (`-{cost} Endu`).",
        color=discord.Color.red(),
    )
    if new_endu == 0:
        embed.add_field(
            name="⚠️ Avertissement",
            value="*Endurance épuisée ! Le personnage ne peut plus effectuer d'action physique.*",
            inline=False,
        )
    await ctx.send(embed=embed)

    # DM MJ : détail privé
    if MJ_USER_ID:
        try:
            mj_user = await bot.fetch_user(MJ_USER_ID)
            await mj_user.send(
                f"🔒 **{full_name}** — {label} : `-{cost} Endu` · "
                f"Endurance actuelle : `{new_endu} / {sheet['max_endurance']}`"
            )
        except (discord.NotFound, discord.Forbidden, discord.HTTPException):
            pass


@bot.command(name="regen-endu")
async def regen_endu(ctx, char_name: str):
    """Lance 1d100 et fixe l'endurance courante (cappée au max du palier)."""
    char = find_char_by_name(char_name)
    if not char:
        await ctx.send(f"❌ Personnage **{char_name}** introuvable.")
        return

    sheet = get_character_sheet(char["id"])
    if not sheet:
        return
    rolled = random.randint(1, 100)
    capped = min(rolled, sheet["max_endurance"])

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE "character" SET current_endurance = %s WHERE id = %s',
                (capped, char["id"]),
            )
            conn.commit()

    embed = discord.Embed(
        title="🔄 Récupération d'Endurance",
        description=f"**{display_name(char)}** lance un dé de récupération (1d100) !",
        color=discord.Color.green(),
    )
    embed.add_field(
        name="Résultat du jet",
        value=f"🎲 Jet de dé : **{rolled}**\n• Endurance fixée à **{capped} / {sheet['max_endurance']} Endu**",
        inline=False,
    )
    await ctx.send(embed=embed)


@bot.command(name="regen")
async def regen_alias(ctx, char_name: str):
    await regen_endu(ctx, char_name)


# --- 3. Jets de dés ---


@bot.command(name="roll")
async def roll_cmd(ctx, char_name: str, *, item_name: str):
    """
    2d6 + Attribut (+ Skill). Crit naturel = 12, échec critique = 2.
    Ex : !roll Brad Sang-Froid · !roll Brad PSYCHÉ · !roll Brad PSY
    """
    char = find_char_by_name(char_name)
    if not char:
        d1, d2 = random.randint(1, 6), random.randint(1, 6)
        await ctx.send(f"🎲 **Jet générique :** 2d6 = `[{d1}, {d2}]` => **{d1 + d2}**")
        return

    sheet = get_character_sheet(char["id"])
    if not sheet:
        return

    # Résolution skill / attribut
    item_key = item_name.strip()
    short = ATTR_SHORTHAND.get(item_key.upper())
    skill_found, attr_found = None, None

    if short:
        attr_found = short
    else:
        for attr, sks in SKILL_GROUPS.items():
            if attr.lower() == item_key.lower():
                attr_found = attr
            for sk in sks:
                if sk.lower() == item_key.lower():
                    skill_found, attr_found = sk, attr

    if not attr_found:
        await ctx.send(f"❌ Aucun attribut ou compétence trouvé pour **{item_name}**.")
        return

    attr_score = sheet["attributes"][attr_found]
    skill_score = sheet["skills"].get(skill_found, 0) if skill_found else 0

    d1, d2 = random.randint(1, 6), random.randint(1, 6)
    dice_sum = d1 + d2
    total = dice_sum + attr_score + skill_score
    is_crit_succ = (d1 == 6 and d2 == 6)
    is_crit_fail = (d1 == 1 and d2 == 1)

    embed = discord.Embed(
        title=f"🎲 Jet : {skill_found if skill_found else attr_found}",
        description=f"**{display_name(sheet)}** effectue un test !",
        color=discord.Color.gold(),
    )
    formula = f"2d6 + {attr_found}" + (f" + {skill_found}" if skill_found else "")
    breakdown = (
        f"`[{d1}, {d2}] ({dice_sum})` + `{attr_score}` ({attr_found})"
        + (f" + `{skill_score}` ({skill_found})" if skill_found else "")
        + f" = **{total}**"
    )
    embed.add_field(name="Formule", value=f"`{formula}`", inline=True)
    embed.add_field(name="Résultat", value=breakdown, inline=False)
    if is_crit_succ:
        embed.add_field(name="👑 RÉUSSITE CRITIQUE", value="Double 6 ! Le destin sourit aux audacieux.", inline=False)
    elif is_crit_fail:
        embed.add_field(name="💀 ÉCHEC CATASTROPHIQUE", value="Double 1 ! L'Impôt Divin réclame son dû.", inline=False)
    await ctx.send(embed=embed)


# --- 4. Fiche / Évolution ---


@bot.command(name="sheet")
async def character_sheet_cmd(ctx, char_name: str):
    """Fiche complète. Endurance révélée seulement en DM ou pour le MJ."""
    char = find_char_by_name(char_name)
    if not char:
        await ctx.send(f"❌ Aucun personnage nommé **{char_name}**.")
        return

    sheet = get_character_sheet(char["id"])
    if not sheet:
        return
    is_mj = _is_mj(ctx) or isinstance(ctx.channel, discord.DMChannel)

    embed = discord.Embed(
        title=f"🎴 Fiche de {display_name(sheet)}",
        description=f"**Niveau :** {sheet['level']}  ·  **Âge :** {sheet['age']} ans",
        color=discord.Color.dark_blue(),
    )

    vitals = (
        f"• Santé (HP) : `{sheet['current_hp']} / {sheet['max_hp']}`\n"
        f"• Stabilité (MHP) : `{sheet['current_mental']} / {sheet['max_mental']}`"
    )
    if is_mj:
        vitals = (
            f"• Endurance : `{sheet['current_endurance']} / {sheet['max_endurance']}` ({sheet['endurance_label']})\n"
            + vitals
            + f"\n• XP : `{sheet['xp']}`"
        )
    else:
        vitals += "\n*🔒 Endurance privée MJ.*"

    embed.add_field(name="Vitalité", value=vitals, inline=False)

    skills_text = ""
    for attr, sks in SKILL_GROUPS.items():
        score = sheet["attributes"][attr]
        skills_text += f"\n**{attr} ({score})**\n"
        for sk in sks:
            skills_text += f"• {sk} : `{sheet['skills'].get(sk, 0)}`\n"
    embed.add_field(name="Attributs & Apprentissages", value=skills_text, inline=False)

    runes_text = "\n".join(f"• Rune : `{r}`" for r in sheet["runes"]) if sheet["runes"] else "*Aucune Rune*"
    embed.add_field(name="Runes Équipées", value=runes_text, inline=True)
    embed.add_field(
        name="Le Sort (Points)",
        value="★" * sheet["fate_points"] + "☆" * (5 - sheet["fate_points"]),
        inline=True,
    )

    await ctx.send(embed=embed)


@bot.command(name="xp")
async def add_xp(ctx, char_name: str, delta: int):
    """[MJ] Ajoute (ou retire) de l'XP. Usage : !xp Brad 500"""
    if not _is_mj(ctx):
        await ctx.message.add_reaction("🚫")
        return

    char = find_char_by_name(char_name)
    if not char:
        await ctx.send(f"❌ Personnage **{char_name}** introuvable.")
        return

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT xp FROM "character" WHERE id = %s', (char["id"],))
            current_xp = (cur.fetchone() or {}).get("xp", 0)
            new_xp = max(0, (current_xp or 0) + delta)
            cur.execute(
                'UPDATE "character" SET xp = %s WHERE id = %s',
                (new_xp, char["id"]),
            )
            conn.commit()

    old_level = calculate_level(current_xp)
    new_level = calculate_level(new_xp)
    msg = f"📈 **{char['name']}** : {current_xp} XP → **{new_xp} XP**"
    if new_level != old_level:
        bonus_delta = get_level_bonus(new_level) - get_level_bonus(old_level)
        msg += f"\n🎉 Passe au niveau **{new_level}** (+{bonus_delta} PV/MHP) !"
    await ctx.send(msg)


@bot.command(name="train")
async def add_training(ctx, char_name: str, count: int = 1):
    """[MJ] Ajoute des entraînements d'Endurance. Usage : !train Brad 3"""
    if not _is_mj(ctx):
        await ctx.message.add_reaction("🚫")
        return

    char = find_char_by_name(char_name)
    if not char:
        await ctx.send(f"❌ Personnage **{char_name}** introuvable.")
        return

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT endurance_trainings FROM "character" WHERE id = %s',
                (char["id"],),
            )
            current = (cur.fetchone() or {}).get("endurance_trainings", 0)
            new_count = max(0, (current or 0) + count)
            cur.execute(
                'UPDATE "character" SET endurance_trainings = %s WHERE id = %s',
                (new_count, char["id"]),
            )
            conn.commit()

    _, old_label = get_endurance_tier(current or 0)
    _, new_label = get_endurance_tier(new_count)
    msg = f"💪 **{char['name']}** : entraînement +{count} ({new_count} au total)"
    if new_label != old_label:
        msg += f"\n🏆 Atteint le palier **{new_label}** !"
    await ctx.send(msg)


# --- Bootstrap ---
if __name__ == "__main__":
    if TOKEN:
        bot.run(TOKEN)
    else:
        print("Avertissement : DISCORD_TOKEN non configuré dans .env. Le bot ne peut pas démarrer.")
