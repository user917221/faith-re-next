"use client";

/**
 * PlateauClient — table de jeu en 3 colonnes :
 *  - Roster (gauche) : statut vital live des 4 persos
 *  - Feed (centre) : carnet des jets publics, anti-chronologique
 *  - Lanceur (droite) : 2 sections, jet d'attribut/skill ou formule libre
 *
 * Refresh polling : router.refresh() toutes les 5s pour propager les vitals
 * et nouveaux jets vers tous les clients connectés. Server Action sur insert
 * appelle déjà revalidatePath("/plateau") — combo synchrone + polling.
 */

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Character } from "@/components/character-sheet/types";
import { VitalBar } from "@/components/character-sheet/VitalBar";
import {
  rollPublicSkill,
  rollPublicFormula,
} from "@/lib/actions/plateau";
import {
  SKILL_GROUPS,
  type AttributeName,
} from "@/lib/skills";

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

/* -------------------------- formatage relative time -------------------------- */

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

/* -------------------------- sigil divider inline -------------------------- */

function SigilDivider({ mark = "✦" }: { mark?: string }) {
  return (
    <div className="sigil-divider !my-3">
      <span className="sigil-mark">{mark}</span>
    </div>
  );
}

/* -------------------------- Roster -------------------------- */

function Roster({ characters, isMJ }: { characters: Character[]; isMJ: boolean }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="label-grimoire">Compagnons</p>
      {characters.map((c) => (
        <div key={c.id} className="card-grimoire flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display tracking-[0.02em] text-gold-aged text-[1.1rem]">
              {c.name}
              {c.nom && (
                <span className="ml-1 text-parchment-dim text-sm">{c.nom}</span>
              )}
            </h3>
            {isMJ && (
              <span className="font-display tabular rounded-[--radius-xs] border border-gold-aged/30 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.15em] text-gold-aged">
                Niv. {c.level}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <VitalBar
              kind="hp"
              current={c.currentHp}
              max={c.maxHp}
              compact
            />
            <VitalBar
              kind="mhp"
              current={c.currentMental}
              max={c.maxMental}
              compact
            />
            <VitalBar
              kind="endu"
              current={c.currentEndurance}
              max={c.maxEndurance}
              compact
            />
          </div>
        </div>
      ))}
    </section>
  );
}

/* -------------------------- Feed -------------------------- */

function FeedHeader() {
  return (
    <div className="sticky top-0 z-[1] -mx-5 -mt-5 mb-3 border-b border-gold-aged/10 bg-ink-near px-5 py-3">
      <p className="label-grimoire">Carnet des jets</p>
    </div>
  );
}

function FeedItemView({ item, currentUserName }: { item: FeedItem; currentUserName: string }) {
  const breakdownPieces: string[] = [];
  if (item.rolls.length > 0) {
    breakdownPieces.push(`[${item.rolls.join(", ")}]`);
    if (item.rolls.length > 1) {
      const sum = item.rolls.reduce((a, b) => a + b, 0);
      breakdownPieces.push(`(${sum})`);
    }
  }
  if (item.attrName && item.attrScore !== null) {
    breakdownPieces.push(`+ ${item.attrName}(${item.attrScore})`);
  }
  if (item.skillName && item.skillScore !== null) {
    breakdownPieces.push(`+ ${item.skillName}(${item.skillScore})`);
  }

  const casterDifferent = item.casterName && item.casterName !== currentUserName;

  return (
    <article className="flex flex-col gap-2">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-display text-gold-aged text-lg tracking-[0.02em]">
          {item.characterName}
          {casterDifferent && (
            <span className="ml-2 text-parchment-faint text-[0.7rem] font-normal">
              · lancé par {item.casterName}
            </span>
          )}
        </h4>
        <span className="text-parchment-mute text-[0.7rem]">
          {formatRelative(item.createdAt)}
        </span>
      </header>

      <p className="tabular text-sm text-parchment-dim">{item.formula}</p>

      <p className="tabular text-[0.78rem] text-parchment-mute">
        {breakdownPieces.join(" ")} = {item.total}
      </p>

      <div className="flex items-baseline justify-between gap-3">
        <span
          className={`font-display tabular text-3xl ${
            item.isCritSucc
              ? "text-gold-bright"
              : item.isCritFail
                ? "text-blood-dried"
                : "text-parchment"
          }`}
        >
          {item.total}
        </span>
        {item.isCritSucc && (
          <span className="font-display sigil-glow inline-flex items-center gap-2 rounded-[--radius-xs] border border-gold-aged/40 bg-ink-deep px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-gold-bright">
            <span aria-hidden>✦</span>
            Réussite critique
          </span>
        )}
        {item.isCritFail && (
          <span className="font-display inline-flex items-center gap-2 rounded-[--radius-xs] border border-blood-dried/30 bg-ink-deep px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] italic text-blood-dried">
            Échec catastrophique
          </span>
        )}
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
  const dividers = ["✦", "✧", "⚜"] as const;

  return (
    <section className="card-grimoire relative max-h-[600px] overflow-y-auto">
      <FeedHeader />
      {items.length === 0 ? (
        <p className="text-sm italic text-parchment-mute">
          Aucun jet n&apos;a encore été inscrit dans le carnet. Lance le premier.
        </p>
      ) : (
        <div className="flex flex-col">
          {items.map((it, idx) => (
            <div key={it.id}>
              <FeedItemView item={it} currentUserName={currentUserName} />
              {idx < items.length - 1 && (
                <SigilDivider mark={dividers[idx % dividers.length]} />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* -------------------------- Lanceur -------------------------- */

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
  const [errorA, setErrorA] = useState<string | null>(null);

  // Section 2 — formule libre
  const [charB, setCharB] = useState(defaultCharacterId);
  const [formula, setFormula] = useState("");
  const [errorB, setErrorB] = useState<string | null>(null);

  // Toggle privé MJ (placeholder, désactivé)
  const [mjPrivate, setMjPrivate] = useState(false);
  void mjPrivate;

  const availableSkills = SKILL_GROUPS[attr] ?? [];

  function submitSkill() {
    setErrorA(null);
    startTransition(async () => {
      const res = await rollPublicSkill({
        characterId: charA,
        attrName: attr,
        skillName: skill || null,
      });
      if (!res.ok) {
        setErrorA(res.reason);
        return;
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
    <section className="card-grimoire flex flex-col gap-4">
      <p className="label-grimoire">Lanceur de dés</p>

      {/* Section 1 — Jet d'attribut/skill */}
      <div className="flex flex-col gap-3">
        <p className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim">
          Jet d&apos;attribut
        </p>

        <label className="flex flex-col gap-1">
          <span className="font-display text-[0.65rem] uppercase tracking-[0.15em] text-parchment-mute">
            Personnage
          </span>
          <select
            value={charA}
            onChange={(e) => setCharA(e.target.value)}
            className="input-grimoire"
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
          <span className="font-display text-[0.65rem] uppercase tracking-[0.15em] text-parchment-mute">
            Attribut
          </span>
          <select
            value={attr}
            onChange={(e) => {
              setAttr(e.target.value as AttributeName);
              setSkill("");
            }}
            className="input-grimoire"
          >
            {ATTRIBUTES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-display text-[0.65rem] uppercase tracking-[0.15em] text-parchment-mute">
            Compétence
          </span>
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="input-grimoire"
          >
            <option value="">— Attribut seul —</option>
            {availableSkills.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={isPending}
          onClick={submitSkill}
          className="btn-grimoire"
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
        <p className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim">
          Formule libre
        </p>

        <label className="flex flex-col gap-1">
          <span className="font-display text-[0.65rem] uppercase tracking-[0.15em] text-parchment-mute">
            Personnage
          </span>
          <select
            value={charB}
            onChange={(e) => setCharB(e.target.value)}
            className="input-grimoire"
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
          <span className="font-display text-[0.65rem] uppercase tracking-[0.15em] text-parchment-mute">
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
          disabled={isPending || !formula.trim()}
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
  isMJ,
}: {
  characters: Character[];
  initialRolls: FeedItem[];
  defaultCharacterId: string;
  currentUserName: string;
  isMJ: boolean;
}) {
  const router = useRouter();

  // Polling 5s — propagation des vitals MJ + nouveaux jets entre clients.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <main className="relative z-[2] min-h-screen px-6 py-10">
      <header className="mx-auto mb-8 flex max-w-7xl flex-wrap items-end justify-between gap-4">
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

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        {/* Roster — gauche */}
        <Roster characters={characters} isMJ={isMJ} />

        {/* Feed — centre */}
        {characters.length === 0 ? (
          <div className="card-grimoire text-sm italic text-parchment-mute">
            Aucun personnage à la table.
          </div>
        ) : (
          <Feed items={initialRolls} currentUserName={currentUserName} />
        )}

        {/* Lanceur — droite */}
        {characters.length > 0 && (
          <Launcher
            characters={characters}
            defaultCharacterId={defaultCharacterId}
            isMJ={isMJ}
          />
        )}
      </div>
    </main>
  );
}
