"use client";

/**
 * PlateauClient — table de jeu en 3 colonnes :
 *  - Roster (gauche) : statut vital live des persos présents (MJ voit aussi
 *    les absents en opacité réduite)
 *  - Feed (centre) : carnet des jets publics, anti-chronologique, scroll
 *    interne avec scrollbar fine
 *  - Lanceur (droite) : sélection attribut/skill + DD switchable, ou formule
 *    libre
 *
 * Refresh polling : router.refresh() toutes les 5s pour propager les vitals
 * et nouveaux jets vers tous les clients connectés. Server Action sur insert
 * appelle déjà revalidatePath("/plateau") — combo synchrone + polling.
 *
 * CritOverlay full-screen écoute le dernier roll et déclenche une animation
 * 2.5s en cas de double-6 / double-1.
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Character } from "@/components/character-sheet/types";
import { VitalBar } from "@/components/character-sheet/VitalBar";
import {
  rollPublicSkill,
  rollPublicFormula,
} from "@/lib/actions/plateau";
import { rollSkillWithDD } from "@/lib/actions/roll-skill-dd";
import {
  SKILL_GROUPS,
  type AttributeName,
} from "@/lib/skills";
import { CritOverlay } from "./CritOverlay";

type FeedItem = {
  id: string;
  characterName: string;
  casterName: string;
  formula: string;
  rolls: number[];
  attrName: string | null;
  attrScore: number | null;
  skillName: string | null;
  skillScore: number | null;
  total: number;
  dd: number | null;
  success: boolean | null;
  isCritSucc: boolean;
  isCritFail: boolean;
  createdAt: Date;
};

const ATTRIBUTES: AttributeName[] = [
  "INTELLECT",
  "PSYCHÉ",
  "CONSTITUTION",
  "MANŒUVRE",
];

const DD_PRESETS = [
  { label: "Facile", value: 6 },
  { label: "Normal", value: 8 },
  { label: "Difficile", value: 11 },
  { label: "Héroïque", value: 14 },
  { label: "Impossible", value: 18 },
] as const;

/* -------------------------- helpers -------------------------- */

function formatRelative(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 10) return "à l'instant";
  if (sec < 60) return `il y a ${sec} s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

function SigilDivider({ mark = "✦" }: { mark?: string }) {
  return (
    <div className="sigil-divider !my-3">
      <span className="sigil-mark">{mark}</span>
    </div>
  );
}

/* -------------------------- Roster -------------------------- */

function CharacterAvatar({ name }: { name: string }) {
  // Avatar = sigil ✦ stylisé. Plus tard, on pourra charger une image.
  return (
    <div
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-aged/30 bg-ink-deep"
      aria-hidden
      title={name}
    >
      <span className="font-display text-xl text-gold-aged">✦</span>
    </div>
  );
}

function RosterCard({
  character,
  isOwner,
  showLevel,
  showAbsent,
}: {
  character: Character;
  isOwner: boolean;
  showLevel: boolean;
  showAbsent: boolean;
}) {
  const absent = showAbsent && !character.isPresent;

  return (
    <div
      className={`card-grimoire card-hover-lift flex flex-col gap-3.5 ${
        absent ? "opacity-50" : ""
      } ${
        isOwner ? "!border-gold-aged/40" : ""
      }`}
    >
      <header className="flex items-start gap-3">
        <CharacterAvatar name={character.name} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display tracking-[0.02em] text-gold-aged text-[1.05rem] leading-tight">
              {character.name}
              {character.nom && (
                <span className="ml-1 text-parchment-dim text-sm font-normal">
                  {character.nom}
                </span>
              )}
            </h3>
            {showLevel && (
              <span className="font-display tabular rounded-[--radius-xs] border border-gold-aged/30 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.15em] text-gold-aged">
                Niv. {character.level}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                character.isPresent ? "presence-led-on" : "presence-led-off"
              }`}
              aria-hidden
            />
            {isOwner ? (
              <span className="font-display text-[0.6rem] uppercase tracking-[0.18em] text-gold-bright">
                Toi
              </span>
            ) : absent ? (
              <span className="font-display text-[0.6rem] uppercase tracking-[0.18em] text-parchment-faint">
                Absent
              </span>
            ) : (
              <span className="font-display text-[0.6rem] uppercase tracking-[0.18em] text-parchment-mute">
                Présent
              </span>
            )}
          </div>
        </div>
      </header>

      {!absent && (
        <div className="flex flex-col gap-2">
          <VitalBar
            kind="hp"
            current={character.currentHp}
            max={character.maxHp}
            compact
          />
          <VitalBar
            kind="mhp"
            current={character.currentMental}
            max={character.maxMental}
            compact
          />
          <VitalBar
            kind="endu"
            current={character.currentEndurance}
            max={character.maxEndurance}
            compact
          />
        </div>
      )}
    </div>
  );
}

function Roster({
  characters,
  isMJ,
  ownedId,
}: {
  characters: Character[];
  isMJ: boolean;
  ownedId: string | null;
}) {
  // Tri : présents d'abord, ensuite owner-first si présent
  const sorted = useMemo(() => {
    const arr = [...characters];
    arr.sort((a, b) => {
      if (a.isPresent !== b.isPresent) return a.isPresent ? -1 : 1;
      if (a.id === ownedId) return -1;
      if (b.id === ownedId) return 1;
      return a.name.localeCompare(b.name);
    });
    return arr;
  }, [characters, ownedId]);

  if (sorted.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <p className="label-grimoire">Compagnons</p>
        <div className="card-grimoire flex flex-col items-center gap-3 py-10 text-center">
          <span className="font-display text-4xl text-parchment-faint">⚜</span>
          <p className="text-sm italic text-parchment-mute">
            Aucun joueur n&apos;a encore rejoint la table.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <p className="label-grimoire">Compagnons</p>
      {sorted.map((c) => (
        <RosterCard
          key={c.id}
          character={c}
          isOwner={c.id === ownedId}
          showLevel={isMJ}
          showAbsent={isMJ}
        />
      ))}
    </section>
  );
}

/* -------------------------- Feed -------------------------- */

function FeedItemView({
  item,
  currentUserName,
}: {
  item: FeedItem;
  currentUserName: string;
}) {
  const breakdownPieces: string[] = [];
  if (item.rolls.length > 0) {
    breakdownPieces.push(`[${item.rolls.join(", ")}]`);
  }
  if (item.attrName && item.attrScore !== null) {
    breakdownPieces.push(`+ ${item.attrName}(${item.attrScore})`);
  }
  if (item.skillName && item.skillScore !== null) {
    breakdownPieces.push(`+ ${item.skillName}(${item.skillScore})`);
  }

  const casterDifferent = item.casterName && item.casterName !== currentUserName;

  // Couleur du total selon résultat
  let totalClass = "text-gold-aged";
  if (item.isCritSucc) totalClass = "text-gold-bright drop-shadow-[0_0_14px_rgba(232,192,116,0.45)]";
  else if (item.isCritFail) totalClass = "text-blood-dried italic";
  else if (item.success === true) totalClass = "text-celadon";
  else if (item.success === false) totalClass = "text-parchment-dim";

  return (
    <article className="flex flex-col gap-1.5 py-3">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-display text-gold-aged text-lg tracking-[0.02em] truncate">
            {item.characterName}
          </h4>
          {casterDifferent && (
            <p className="text-parchment-faint text-[0.68rem]">
              lancé par {item.casterName}
            </p>
          )}
        </div>
        <span className="text-parchment-mute text-[0.68rem] tabular shrink-0">
          {formatRelative(item.createdAt)}
        </span>
      </header>

      <p className="tabular text-[0.78rem] text-parchment-dim">{item.formula}</p>

      <p className="tabular text-[0.7rem] text-parchment-mute">
        {breakdownPieces.join(" ")}
      </p>

      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className={`font-display tabular text-4xl leading-none ${totalClass}`}>
            {item.total}
          </span>
          {item.dd !== null && (
            <span className="tabular text-[0.7rem] text-parchment-mute">
              / DD {item.dd}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {item.dd !== null && !item.isCritSucc && !item.isCritFail && (
            <span
              className={`font-display rounded-[--radius-xs] border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.16em] ${
                item.success
                  ? "border-celadon/40 bg-celadon/10 text-celadon"
                  : "border-blood-dried/35 bg-blood-dried/10 text-blood-dried"
              }`}
            >
              {item.success ? "✓ Réussite" : "✗ Échec"}
            </span>
          )}
          {item.isCritSucc && (
            <span className="font-display sigil-glow inline-flex items-center gap-1.5 rounded-[--radius-xs] border border-gold-aged/50 bg-gold-aged/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.16em] text-gold-bright">
              <span aria-hidden>✦</span>
              Réussite critique
            </span>
          )}
          {item.isCritFail && (
            <span className="font-display inline-flex items-center gap-1.5 rounded-[--radius-xs] border border-blood-dried/40 bg-blood-dried/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.16em] italic text-blood-dried">
              Échec catastrophique
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function Feed({
  items,
  currentUserName,
}: {
  items: FeedItem[];
  currentUserName: string;
}) {
  return (
    <section className="card-grimoire flex min-w-0 flex-col">
      <header className="-mx-5 -mt-5 mb-2 flex items-baseline justify-between gap-2 border-b border-gold-aged/12 bg-ink-near px-5 py-3">
        <p className="label-grimoire">Carnet des jets</p>
        <span className="font-display tabular text-[0.62rem] uppercase tracking-[0.14em] text-parchment-mute">
          {items.length} / 30
        </span>
      </header>
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="font-display text-5xl text-parchment-faint">✦</span>
          <p className="text-sm italic text-parchment-mute">
            Aucun jet n&apos;a été inscrit. Lance le premier.
          </p>
        </div>
      ) : (
        <div className="scrollbar-grimoire flex-1 overflow-y-auto pr-1.5">
          <div className="flex flex-col divide-y divide-gold-soft/15">
            {items.map((it, idx) => {
              const showSigil = idx > 0 && idx % 5 === 0;
              return (
                <div key={it.id}>
                  {showSigil && <SigilDivider mark="✧" />}
                  <FeedItemView item={it} currentUserName={currentUserName} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/* -------------------------- Lanceur -------------------------- */

function AttrRadioGrid({
  value,
  onChange,
}: {
  value: AttributeName;
  onChange: (a: AttributeName) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {ATTRIBUTES.map((a) => {
        const active = value === a;
        return (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            className={`focus-grimoire rounded-[--radius-sm] border px-2 py-2 text-center transition-colors ${
              active
                ? "border-gold-aged/60 bg-gold-aged/15 text-gold-bright"
                : "border-gold-aged/15 text-parchment-dim hover:border-gold-aged/35 hover:text-parchment"
            }`}
          >
            <span className="font-display text-[0.62rem] uppercase tracking-[0.14em]">
              {a}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DDChipsRow({
  value,
  onChange,
  customDD,
  onCustomChange,
}: {
  value: number | "free" | "libre";
  onChange: (v: number | "free" | "libre") => void;
  customDD: number;
  onCustomChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {DD_PRESETS.map((p) => {
          const active = value === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              className={`focus-grimoire flex flex-col items-center rounded-[--radius-xs] border px-2 py-1 transition-colors ${
                active
                  ? "dd-chip-active"
                  : "border-gold-aged/15 text-parchment-dim hover:border-gold-aged/35 hover:text-parchment"
              }`}
            >
              <span className="font-display text-[0.55rem] uppercase tracking-[0.12em]">
                {p.label}
              </span>
              <span className="tabular text-[0.72rem]">{p.value}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange("free")}
          className={`focus-grimoire flex flex-col items-center rounded-[--radius-xs] border px-2 py-1 transition-colors ${
            value === "free"
              ? "dd-chip-active"
              : "border-gold-aged/15 text-parchment-dim hover:border-gold-aged/35 hover:text-parchment"
          }`}
        >
          <span className="font-display text-[0.55rem] uppercase tracking-[0.12em]">
            DD
          </span>
          <span className="tabular text-[0.72rem]">{customDD}</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("libre")}
          className={`focus-grimoire flex flex-col items-center rounded-[--radius-xs] border px-2 py-1 transition-colors ${
            value === "libre"
              ? "dd-chip-active"
              : "border-gold-aged/15 text-parchment-dim hover:border-gold-aged/35 hover:text-parchment"
          }`}
        >
          <span className="font-display text-[0.55rem] uppercase tracking-[0.12em]">
            Libre
          </span>
          <span className="text-[0.72rem]">∞</span>
        </button>
      </div>
      {value === "free" && (
        <div className="flex items-center gap-2">
          <span className="font-display text-[0.6rem] uppercase tracking-[0.14em] text-parchment-mute">
            DD perso
          </span>
          <input
            type="number"
            min={1}
            max={30}
            value={customDD}
            onChange={(e) =>
              onCustomChange(Math.max(1, Math.min(30, parseInt(e.target.value || "0", 10) || 1)))
            }
            onFocus={(e) => e.currentTarget.select()}
            className="tabular h-7 w-16 rounded-[--radius-xs] border border-gold-aged/18 bg-ink-deep px-2 text-center text-[0.85rem] text-parchment outline-none focus-visible:border-gold-aged/45"
          />
        </div>
      )}
    </div>
  );
}

function Launcher({
  characters,
  defaultCharacterId,
  isMJ,
}: {
  characters: Character[];
  defaultCharacterId: string;
  isMJ: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Section 1 — jet d'attribut/skill
  const [charA, setCharA] = useState(defaultCharacterId);
  const [attr, setAttr] = useState<AttributeName>("INTELLECT");
  const [skill, setSkill] = useState<string>("");
  const [ddMode, setDdMode] = useState<number | "free" | "libre">(8);
  const [customDD, setCustomDD] = useState<number>(10);
  const [errorA, setErrorA] = useState<string | null>(null);

  // Section 2 — formule libre
  const [charB, setCharB] = useState(defaultCharacterId);
  const [formula, setFormula] = useState("");
  const [errorB, setErrorB] = useState<string | null>(null);

  // Toggle privé MJ (placeholder, désactivé)
  const [mjPrivate, setMjPrivate] = useState(false);
  void mjPrivate;

  const availableSkills = SKILL_GROUPS[attr] ?? [];

  function effectiveDD(): number | null {
    if (ddMode === "libre") return null;
    if (ddMode === "free") return Math.max(1, Math.min(30, customDD));
    return ddMode;
  }

  function submitSkill() {
    setErrorA(null);
    const dd = effectiveDD();
    startTransition(async () => {
      // Si un DD est défini → utiliser rollSkillWithDD (persiste dd + success)
      if (dd !== null) {
        const res = await rollSkillWithDD({
          characterId: charA,
          attrName: attr,
          skillName: skill || null,
          dd,
        });
        if (!res.ok) {
          setErrorA(res.reason);
          return;
        }
      } else {
        // Mode "libre" → ancien rollPublicSkill (pas de DD)
        const res = await rollPublicSkill({
          characterId: charA,
          attrName: attr,
          skillName: skill || null,
        });
        if (!res.ok) {
          setErrorA(res.reason);
          return;
        }
      }
      router.refresh();
    });
  }

  function submitFormula() {
    setErrorB(null);
    startTransition(async () => {
      const res = await rollPublicFormula({
        characterId: charB,
        formula,
      });
      if (!res.ok) {
        setErrorB(res.reason);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="card-grimoire flex flex-col gap-5">
      <p className="label-grimoire">Lanceur de dés</p>

      {/* Section 1 — Jet d'attribut/skill */}
      <div className="flex flex-col gap-3">
        <p className="font-display text-[0.68rem] uppercase tracking-[0.18em] text-parchment-dim">
          Jet d&apos;attribut
        </p>

        <label className="flex flex-col gap-1">
          <span className="font-display text-[0.6rem] uppercase tracking-[0.14em] text-parchment-mute">
            Personnage
          </span>
          <select
            value={charA}
            onChange={(e) => setCharA(e.target.value)}
            className="select-grimoire"
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.nom ? ` ${c.nom}` : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="font-display text-[0.6rem] uppercase tracking-[0.14em] text-parchment-mute">
            Attribut
          </span>
          <AttrRadioGrid
            value={attr}
            onChange={(a) => {
              setAttr(a);
              setSkill("");
            }}
          />
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-display text-[0.6rem] uppercase tracking-[0.14em] text-parchment-mute">
            Compétence (optionnelle)
          </span>
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="select-grimoire"
          >
            <option value="">— Attribut seul —</option>
            {availableSkills.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="font-display text-[0.6rem] uppercase tracking-[0.14em] text-parchment-mute">
            Difficulté
          </span>
          <DDChipsRow
            value={ddMode}
            onChange={setDdMode}
            customDD={customDD}
            onCustomChange={setCustomDD}
          />
        </div>

        <button
          type="button"
          disabled={isPending || !charA}
          onClick={submitSkill}
          className="btn-grimoire mt-1"
        >
          Lancer le jet
        </button>

        {errorA && (
          <p className="text-[0.7rem] italic text-blood-dried">{errorA}</p>
        )}
      </div>

      <SigilDivider mark="✧" />

      {/* Section 2 — Formule libre */}
      <div className="flex flex-col gap-3">
        <p className="font-display text-[0.68rem] uppercase tracking-[0.18em] text-parchment-dim">
          Formule libre
        </p>

        <label className="flex flex-col gap-1">
          <span className="font-display text-[0.6rem] uppercase tracking-[0.14em] text-parchment-mute">
            Personnage
          </span>
          <select
            value={charB}
            onChange={(e) => setCharB(e.target.value)}
            className="select-grimoire"
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.nom ? ` ${c.nom}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-display text-[0.6rem] uppercase tracking-[0.14em] text-parchment-mute">
            Formule
          </span>
          <input
            type="text"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="ex : 2d6+5, 2d6+INT, 1d100+PSY"
            className="input-grimoire tabular"
          />
        </label>

        <button
          type="button"
          disabled={isPending || !formula.trim() || !charB}
          onClick={submitFormula}
          className="btn-grimoire"
        >
          Lancer la formule
        </button>

        {errorB && (
          <p className="text-[0.7rem] italic text-blood-dried">{errorB}</p>
        )}
      </div>

      {isMJ && (
        <>
          <SigilDivider mark="⚜" />
          <label
            className="flex cursor-not-allowed items-center gap-2 text-[0.7rem] text-parchment-mute"
            title="Bientôt"
          >
            <input
              type="checkbox"
              checked={false}
              disabled
              onChange={(e) => setMjPrivate(e.target.checked)}
              className="accent-gold-aged"
            />
            <span className="font-display uppercase tracking-[0.12em]">
              Jet privé MJ
            </span>
            <span className="ml-auto text-parchment-faint italic">bientôt</span>
          </label>
        </>
      )}
    </section>
  );
}

/* -------------------------- Container -------------------------- */

export function PlateauClient({
  characters,
  initialRolls,
  defaultCharacterId,
  currentUserName,
  ownedCharacterId,
  isMJ,
}: {
  characters: Character[];
  initialRolls: FeedItem[];
  defaultCharacterId: string;
  currentUserName: string;
  currentUserId: string;
  ownedCharacterId: string | null;
  isMJ: boolean;
}) {
  const router = useRouter();

  // Polling 5s — propagation des vitals MJ + nouveaux jets entre clients.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [router]);

  // Le dernier roll pour le CritOverlay
  const latestRoll = initialRolls.length > 0
    ? {
        id: initialRolls[0].id,
        isCritSucc: initialRolls[0].isCritSucc,
        isCritFail: initialRolls[0].isCritFail,
      }
    : null;

  return (
    <main className="relative z-[2] min-h-screen px-6 py-8">
      <CritOverlay latestRoll={latestRoll} />

      <header className="mx-auto mb-7 flex max-w-7xl flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.22em] text-gold-aged">
            Table ouverte
          </p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-[0.02em] text-parchment">
            Plateau de jeu
          </h1>
        </div>
        <nav className="flex items-center gap-4 text-xs">
          <Link
            href={isMJ ? "/mj" : "/me"}
            className="font-display uppercase tracking-[0.18em] text-parchment-dim transition-colors hover:text-gold-aged"
          >
            {isMJ ? "Tableau MJ →" : "Ma fiche →"}
          </Link>
        </nav>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)_340px]">
        {/* Roster — gauche */}
        <Roster characters={characters} isMJ={isMJ} ownedId={ownedCharacterId} />

        {/* Feed — centre */}
        <div className="flex min-w-0 flex-col">
          <Feed items={initialRolls} currentUserName={currentUserName} />
        </div>

        {/* Lanceur — droite */}
        {characters.length > 0 ? (
          <Launcher
            characters={characters}
            defaultCharacterId={defaultCharacterId}
            isMJ={isMJ}
          />
        ) : (
          <div className="card-grimoire flex items-center justify-center text-center text-sm italic text-parchment-mute">
            Aucun personnage à la table — impossible de lancer.
          </div>
        )}
      </div>
    </main>
  );
}
