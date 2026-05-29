"use client";

/**
 * PlateauClient — bento industrial-mystique inspiré Petronex Oil & Gas.
 *
 * Layout grid-cols-12 :
 *  - Header (12) : RoundTableGlyph + titre Plateau + nav
 *  - Roster (3) : sticky list-portfolio des compagnons à la table
 *  - Hero "Dernier acte" (6) : card-hero, big-number gold-bright pour le total
 *  - Lanceur (3) : sticky, attribut/skill switchable, formule libre
 *  - Carnet des jets (12) : list-portfolio scrollable des 30 derniers jets
 *
 * Polling 5s — propagation cross-clients des vitals + nouveaux jets.
 * CritOverlay z-50 au-dessus de tout en cas de double-6 / double-1.
 *
 * Hiérarchie visuelle : le BIG NUMBER du dernier jet est l'élément le plus
 * imprégnant — visible à 2m sur l'écran partagé d'une table.
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Character } from "@/components/character-sheet/types";
import {
  rollPublicSkill,
  rollPublicFormula,
} from "@/lib/actions/plateau";
import { rollSkillWithDD } from "@/lib/actions/roll-skill-dd";
import {
  SKILL_GROUPS,
  type AttributeName,
} from "@/lib/skills";
import { RoundTableGlyph, GrimoireGlyph } from "@/components/glyphs";
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

/* -------------------------- Mini bar vital (roster, 8px) -------------------------- */

function MiniBar({
  kind,
  current,
  max,
}: {
  kind: "hp" | "mhp" | "endu";
  current: number;
  max: number;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const palette = {
    hp: { from: "#d57272", to: "#7a3a3a", text: "text-blood-dried" },
    mhp: { from: "#b9a4e3", to: "#5a4495", text: "text-amethyst" },
    endu: { from: "#a9c8ac", to: "#4f7053", text: "text-celadon" },
  }[kind];
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-2 flex-1 overflow-hidden rounded-[--radius-xs] border border-gold-aged/12 bg-ink-deep">
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(180deg, ${palette.from} 0%, ${palette.to} 100%)`,
          }}
        />
      </div>
      <span className={`tabular text-[0.62rem] tracking-tight ${palette.text} w-12 text-right`}>
        {current}
        <span className="text-parchment-faint">/{max}</span>
      </span>
    </div>
  );
}

/* -------------------------- Roster — portfolio list -------------------------- */

function RosterItem({
  character,
  isOwner,
  showLevel,
}: {
  character: Character;
  isOwner: boolean;
  showLevel: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
            character.isPresent ? "presence-led-on" : "presence-led-off"
          }`}
          aria-hidden
        />
        <div
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-aged/40 bg-gold-aged/15"
          aria-hidden
          title={character.name}
        >
          <span className="font-display text-[0.85rem] leading-none text-gold-aged">✦</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-display text-[0.95rem] leading-tight tracking-[0.02em] text-gold-aged truncate">
              {character.name}
              {character.nom && (
                <span className="ml-1 text-[0.7rem] font-normal text-parchment-dim">
                  {character.nom}
                </span>
              )}
            </h4>
            {showLevel && (
              <span className="font-display tabular rounded-[--radius-xs] border border-gold-aged/30 px-1.5 py-0.5 text-[0.52rem] uppercase tracking-[0.16em] text-gold-aged">
                Niv. {character.level}
              </span>
            )}
          </div>
          {isOwner && (
            <p className="font-display mt-0.5 text-[0.55rem] uppercase tracking-[0.18em] text-gold-bright">
              Toi
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 pl-[3.25rem]">
        <MiniBar kind="hp" current={character.currentHp} max={character.maxHp} />
        <MiniBar kind="mhp" current={character.currentMental} max={character.maxMental} />
        <MiniBar kind="endu" current={character.currentEndurance} max={character.maxEndurance} />
      </div>
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
  // Tri : présents d'abord, owner-first si présent
  const sorted = useMemo(() => {
    const arr = characters.filter((c) => c.isPresent);
    arr.sort((a, b) => {
      if (a.id === ownedId) return -1;
      if (b.id === ownedId) return 1;
      return a.name.localeCompare(b.name);
    });
    return arr;
  }, [characters, ownedId]);

  const presentCount = sorted.length;

  return (
    <section className="card-grimoire flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
      <header className="flex items-baseline justify-between gap-2">
        <p className="label-grimoire">Compagnons à la table</p>
        <span className="font-display tabular text-[0.6rem] uppercase tracking-[0.16em] text-parchment-mute">
          {presentCount}
        </span>
      </header>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center text-parchment-faint">
          <RoundTableGlyph size={100} className="opacity-60" />
          <p className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-mute">
            La table est encore vide
          </p>
          <p className="text-[0.7rem] italic text-parchment-faint">
            En attente des compagnons.
          </p>
        </div>
      ) : (
        <div className="list-portfolio -mx-5 -mb-5">
          {sorted.map((c) => (
            <RosterItem
              key={c.id}
              character={c}
              isOwner={c.id === ownedId}
              showLevel={isMJ}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* -------------------------- Hero — Dernier acte -------------------------- */

function LastActHero({ item }: { item: FeedItem | null }) {
  if (!item) {
    return (
      <section className="card-hero flex min-h-[260px] flex-col items-center justify-center gap-4 text-center lg:min-h-[320px]">
        <div className="text-parchment-faint">
          <RoundTableGlyph size={150} className="opacity-60" />
        </div>
        <p className="label-grimoire">Dernier acte</p>
        <p className="font-display text-[0.85rem] uppercase tracking-[0.22em] text-parchment-dim">
          Aucun jet inscrit
        </p>
        <p className="max-w-md text-[0.78rem] italic text-parchment-mute">
          Lance le premier — l&apos;Impôt Divin observe.
        </p>
      </section>
    );
  }

  // Breakdown : [1, 5] + INTELLECT(8) + Logique(3)
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

  // Couleur du big number
  let totalClass = "text-gold-bright";
  let totalShadow = "drop-shadow-[0_0_28px_rgba(232,192,116,0.4)]";
  if (item.isCritSucc) {
    totalClass = "text-gold-bright";
    totalShadow = "drop-shadow-[0_0_42px_rgba(232,192,116,0.7)]";
  } else if (item.isCritFail) {
    totalClass = "text-blood-dried italic";
    totalShadow = "drop-shadow-[0_0_28px_rgba(179,90,90,0.55)]";
  } else if (item.success === true) {
    totalClass = "text-celadon";
    totalShadow = "drop-shadow-[0_0_28px_rgba(142,176,145,0.45)]";
  } else if (item.success === false) {
    totalClass = "text-parchment-dim";
    totalShadow = "";
  }

  return (
    <section className="card-hero flex min-h-[260px] flex-col gap-4 lg:min-h-[320px]">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="label-grimoire">Dernier acte</p>
        <span className="font-display tabular text-[0.62rem] uppercase tracking-[0.14em] text-parchment-mute">
          {formatRelative(item.createdAt)}
        </span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <h2 className="font-display text-2xl tracking-[0.04em] text-gold-aged sm:text-3xl">
          {item.characterName}
        </h2>
        {item.casterName && item.casterName !== item.characterName && (
          <p className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-parchment-mute">
            Lancé par {item.casterName}
          </p>
        )}

        <p className="tabular text-[0.85rem] text-parchment-dim">{item.formula}</p>

        <div className="flex items-end justify-center gap-3">
          <span
            key={item.id}
            className={`big-number font-display ${totalClass} ${totalShadow}`}
            style={{ animation: "vital-flash 0.35s ease-out" }}
          >
            {item.total}
          </span>
          {item.dd !== null && (
            <span className="font-display tabular mb-2 text-base uppercase tracking-[0.16em] text-parchment-mute sm:text-lg">
              / DD {item.dd}
            </span>
          )}
        </div>

        {breakdownPieces.length > 0 && (
          <p className="tabular text-[0.72rem] text-parchment-mute">
            {breakdownPieces.join(" ")}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {item.isCritSucc && (
            <span className="font-display sigil-glow inline-flex items-center gap-1.5 rounded-[--radius-xs] border border-gold-aged/50 bg-gold-aged/10 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-gold-bright">
              <span aria-hidden>✦</span>
              Réussite critique
            </span>
          )}
          {item.isCritFail && (
            <span className="font-display inline-flex items-center gap-1.5 rounded-[--radius-xs] border border-blood-dried/40 bg-blood-dried/10 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.16em] italic text-blood-dried">
              Échec catastrophique
            </span>
          )}
          {item.dd !== null && !item.isCritSucc && !item.isCritFail && (
            <span
              className={`font-display inline-flex items-center rounded-[--radius-xs] border px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.16em] ${
                item.success
                  ? "border-celadon/40 bg-celadon/10 text-celadon"
                  : "border-blood-dried/35 bg-blood-dried/10 text-blood-dried"
              }`}
            >
              {item.success ? "Réussite" : "Échec"}
            </span>
          )}
        </div>
      </div>
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
            className={`focus-grimoire rounded-[--radius-sm] border px-2 py-2 text-center transition-all hover:-translate-y-px ${
              active
                ? "border-gold-aged/60 bg-gold-aged/15 text-gold-bright"
                : "border-gold-aged/15 text-parchment-dim hover:border-gold-aged/35 hover:text-parchment"
            }`}
          >
            <span className="font-display text-[0.6rem] uppercase tracking-[0.14em]">
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
            className="tabular h-7 w-16 rounded-[--radius-xs] border border-gold-aged/18 bg-ink-deep px-2 text-center text-[0.85rem] text-parchment outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-aged/40"
          />
        </div>
      )}
    </div>
  );
}

function Launcher({
  characters,
  defaultCharacterId,
}: {
  characters: Character[];
  defaultCharacterId: string;
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

  // Compute le bouton "Lancer 2d6+X" — montre l'estimation grossière (score attr+skill).
  // On ne connait pas le score côté client sans charger la fiche ; donc on affiche juste
  // l'attribut court.
  const attrShort: Record<AttributeName, string> = {
    INTELLECT: "INT",
    PSYCHÉ: "PSY",
    CONSTITUTION: "CON",
    MANŒUVRE: "MAN",
  };

  return (
    <section className="card-grimoire flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
      <header className="flex items-center gap-3">
        <div className="text-gold-aged">
          <GrimoireGlyph size={40} />
        </div>
        <div>
          <p className="label-grimoire">Lanceur</p>
          <p className="font-display mt-0.5 text-[0.62rem] uppercase tracking-[0.18em] text-parchment-mute">
            Jet d&apos;attribut · 2d6
          </p>
        </div>
      </header>

      {/* Section 1 — Jet d'attribut/skill */}
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-display text-[0.58rem] uppercase tracking-[0.14em] text-parchment-mute">
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
          <span className="font-display text-[0.58rem] uppercase tracking-[0.14em] text-parchment-mute">
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
          <span className="font-display text-[0.58rem] uppercase tracking-[0.14em] text-parchment-mute">
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
          <span className="font-display text-[0.58rem] uppercase tracking-[0.14em] text-parchment-mute">
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
          className="btn-grimoire mt-1 tracking-[0.12em]"
        >
          Lancer 2d6 + {attrShort[attr]}
          {skill ? " + skill" : ""}
        </button>

        {errorA && (
          <p className="text-[0.7rem] italic text-blood-dried">{errorA}</p>
        )}
      </div>

      <SigilDivider mark="✧" />

      {/* Section 2 — Formule libre */}
      <div className="flex flex-col gap-3">
        <p className="font-display text-[0.66rem] uppercase tracking-[0.18em] text-parchment-dim">
          Formule libre
        </p>

        <label className="flex flex-col gap-1">
          <span className="font-display text-[0.58rem] uppercase tracking-[0.14em] text-parchment-mute">
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
          <span className="font-display text-[0.58rem] uppercase tracking-[0.14em] text-parchment-mute">
            Formule
          </span>
          <input
            type="text"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="2d6+5, 2d6+INT, 1d100+PSY"
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
    </section>
  );
}

/* -------------------------- Carnet des jets — list-portfolio -------------------------- */

function CarnetRow({ item }: { item: FeedItem }) {
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

  // Couleur du total
  let totalClass = "text-gold-aged";
  if (item.isCritSucc) {
    totalClass =
      "text-gold-bright drop-shadow-[0_0_14px_rgba(232,192,116,0.5)]";
  } else if (item.isCritFail) {
    totalClass = "text-blood-dried italic";
  } else if (item.success === true) {
    totalClass = "text-celadon";
  } else if (item.success === false) {
    totalClass = "text-parchment-dim";
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Gauche : perso + formule + breakdown */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h4 className="font-display truncate text-base tracking-[0.02em] text-gold-aged">
            {item.characterName}
          </h4>
          {item.casterName && item.casterName !== item.characterName && (
            <span className="font-display text-[0.58rem] uppercase tracking-[0.16em] text-parchment-faint">
              · {item.casterName}
            </span>
          )}
          <span className="ml-auto font-display tabular text-[0.58rem] uppercase tracking-[0.14em] text-parchment-mute">
            {formatRelative(item.createdAt)}
          </span>
        </div>
        <p className="tabular mt-0.5 text-[0.7rem] text-parchment-dim">
          {item.formula}
          {breakdownPieces.length > 0 && (
            <span className="text-parchment-mute"> · {breakdownPieces.join(" ")}</span>
          )}
        </p>
      </div>

      {/* Droite : total + badge */}
      <div className="flex shrink-0 items-baseline gap-3">
        <div className="flex items-baseline gap-1">
          <span className={`font-display tabular text-2xl leading-none sm:text-3xl ${totalClass}`}>
            {item.total}
          </span>
          {item.dd !== null && (
            <span className="tabular text-[0.65rem] text-parchment-mute">
              / {item.dd}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5">
          {item.isCritSucc && (
            <span className="font-display inline-flex items-center gap-1 rounded-[--radius-xs] border border-gold-aged/50 bg-gold-aged/10 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.14em] text-gold-bright">
              <span aria-hidden>✦</span>
              Crit
            </span>
          )}
          {item.isCritFail && (
            <span className="font-display inline-flex items-center rounded-[--radius-xs] border border-blood-dried/40 bg-blood-dried/10 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.14em] italic text-blood-dried">
              Désastre
            </span>
          )}
          {item.dd !== null && !item.isCritSucc && !item.isCritFail && (
            <span
              className={`font-display inline-flex items-center rounded-[--radius-xs] border px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.14em] ${
                item.success
                  ? "border-celadon/40 bg-celadon/10 text-celadon"
                  : "border-blood-dried/35 bg-blood-dried/10 text-blood-dried"
              }`}
            >
              {item.success ? "Réussite" : "Échec"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Carnet({ items }: { items: FeedItem[] }) {
  return (
    <section className="card-grimoire flex min-w-0 flex-col">
      <header className="-mx-5 -mt-5 mb-3 flex items-baseline justify-between gap-2 border-b border-gold-aged/15 bg-ink-near px-5 py-3">
        <p className="label-grimoire">Carnet des jets</p>
        <span className="font-display tabular text-[0.6rem] uppercase tracking-[0.14em] text-parchment-mute">
          {items.length} / 30
        </span>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <span className="font-display text-5xl text-parchment-faint">✦</span>
          <p className="text-sm italic text-parchment-mute">
            Aucun jet n&apos;a été inscrit. Lance le premier.
          </p>
        </div>
      ) : (
        <div className="scrollbar-grimoire -mx-5 -mb-5 max-h-[600px] overflow-y-auto">
          <div className="list-portfolio">
            {items.map((it, idx) => {
              const showSigil = idx > 0 && idx % 5 === 0;
              return (
                <div key={it.id}>
                  {showSigil && (
                    <div className="sigil-divider !my-2 !mx-5">
                      <span className="sigil-mark">✧</span>
                    </div>
                  )}
                  <CarnetRow item={it} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/* -------------------------- Container -------------------------- */

export function PlateauClient({
  characters,
  initialRolls,
  defaultCharacterId,
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

  // Polling 5s — propagation vitals + rolls cross-clients.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [router]);

  const latestRoll = initialRolls.length > 0
    ? {
        id: initialRolls[0].id,
        isCritSucc: initialRolls[0].isCritSucc,
        isCritFail: initialRolls[0].isCritFail,
      }
    : null;

  const presentCount = characters.filter((c) => c.isPresent).length;

  return (
    <main className="relative z-[2] min-h-screen px-6 py-8">
      <CritOverlay latestRoll={latestRoll} />

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4 lg:gap-6">
        {/* Header — col-span-12 */}
        <header className="col-span-12 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-gold-aged">
              <RoundTableGlyph size={60} className="sigil-glow" />
            </div>
            <div>
              <p className="label-grimoire">Table ouverte</p>
              <h1 className="font-display mt-1 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[0.02em] text-gold-aged">
                Plateau de jeu
              </h1>
              <p className="font-display mt-1 text-[0.7rem] uppercase tracking-[0.2em] text-parchment-dim">
                Session ouverte · {presentCount} {presentCount > 1 ? "joueurs" : "joueur"}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-xs">
            <Link
              href={isMJ ? "/mj" : "/me"}
              className="font-display rounded-[--radius-sm] border border-gold-aged/20 px-3 py-2 uppercase tracking-[0.18em] text-parchment-dim transition-all hover:-translate-y-px hover:border-gold-aged/40 hover:text-gold-aged focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-aged/40"
            >
              {isMJ ? "Tableau MJ →" : "Ma fiche →"}
            </Link>
          </nav>
        </header>

        {/* Roster — col-span-12 mobile, col-span-3 desktop */}
        <div className="col-span-12 lg:col-span-3">
          <Roster
            characters={characters}
            isMJ={isMJ}
            ownedId={ownedCharacterId}
          />
        </div>

        {/* Hero "Dernier acte" — col-span-12 mobile, col-span-6 desktop */}
        <div className="col-span-12 lg:col-span-6">
          <LastActHero item={initialRolls[0] ?? null} />
        </div>

        {/* Lanceur — col-span-12 mobile, col-span-3 desktop */}
        <div className="col-span-12 lg:col-span-3">
          {characters.length > 0 ? (
            <Launcher
              characters={characters}
              defaultCharacterId={defaultCharacterId}
            />
          ) : (
            <div className="card-grimoire flex min-h-[200px] items-center justify-center text-center text-sm italic text-parchment-mute">
              Aucun personnage à la table.
            </div>
          )}
        </div>

        {/* Carnet des jets — col-span-12 */}
        <div className="col-span-12">
          <Carnet items={initialRolls} />
        </div>
      </div>
    </main>
  );
}
