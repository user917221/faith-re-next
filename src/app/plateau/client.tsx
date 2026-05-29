"use client";

/**
 * PlateauClient — dashboard Linear (issue list / project view) pour la table partagée.
 *
 * Layout 3 colonnes dense + carnet pleine largeur :
 *  - Header (12) : RoundTableGlyph discret + titre + sub "Session ouverte" + nav ghost
 *  - Roster compagnons (gauche, ~280px) : Card + ScrollArea, lignes denses
 *    Avatar + nom + LED présence + 3 mini barres vitaux (Progress h-1, hp/mhp/endu)
 *  - Hero "Dernier acte" (centre, flex-1) : Card, big-number lavande/hp du total
 *  - Lanceur (droite, ~320px) : Card, Select perso, attributs en boutons, DD chips
 *  - Carnet des jets (12) : Card header sticky + ScrollArea, lignes list-portfolio
 *
 * Polling 5s — propagation cross-clients des vitals + nouveaux jets.
 * CritOverlay z-50 au-dessus de tout en cas de double-6 / double-1.
 *
 * Hiérarchie Linear : surface ladder (canvas → card → popover) + hairlines 1px,
 * accent lavande SCARCE (un CTA "Lancer" par section, focus ring). Le BIG NUMBER
 * du dernier jet est l'élément le plus imprégnant — lisible à 2m sur l'écran partagé.
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
import { RoundTableGlyph } from "@/components/glyphs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function buildBreakdown(item: FeedItem): string[] {
  const pieces: string[] = [];
  if (item.rolls.length > 0) {
    pieces.push(`[${item.rolls.join(", ")}]`);
  }
  if (item.attrName && item.attrScore !== null) {
    pieces.push(`+ ${item.attrName}(${item.attrScore})`);
  }
  if (item.skillName && item.skillScore !== null) {
    pieces.push(`+ ${item.skillName}(${item.skillScore})`);
  }
  return pieces;
}

/* -------------------------- Mini bar vital (roster, Progress h-1) -------------------------- */

const VITAL_META = {
  hp: { indicator: "[&_[data-slot=progress-indicator]]:bg-hp", text: "text-hp" },
  mhp: { indicator: "[&_[data-slot=progress-indicator]]:bg-mhp", text: "text-mhp" },
  endu: { indicator: "[&_[data-slot=progress-indicator]]:bg-endu", text: "text-endu" },
} as const;

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
  const meta = VITAL_META[kind];
  return (
    <div className="flex items-center gap-2">
      <Progress
        value={pct}
        className={`h-1 flex-1 bg-secondary ${meta.indicator}`}
      />
      <span className={`tabular w-12 shrink-0 text-right text-[0.62rem] ${meta.text}`}>
        {current}
        <span className="text-ink-tertiary">/{max}</span>
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
          className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
            character.isPresent ? "presence-led-on" : "presence-led-off"
          }`}
          aria-hidden
        />
        <Avatar size="sm" className="mt-0.5 shrink-0">
          <AvatarFallback className="bg-secondary text-[0.62rem] font-medium text-muted-foreground">
            {initials(character.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <h4 className="truncate text-sm font-medium tracking-tight text-foreground">
              {character.name}
              {character.nom && (
                <span className="ml-1 text-[0.72rem] font-normal text-muted-foreground">
                  {character.nom}
                </span>
              )}
            </h4>
            {showLevel && (
              <Badge variant="outline" className="tabular shrink-0 text-ink-tertiary">
                Niv. {character.level}
              </Badge>
            )}
          </div>
          {isOwner && (
            <p className="mt-0.5 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Toi
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pl-[2.75rem]">
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
    <Card className="gap-0 py-0 lg:sticky lg:top-6 lg:self-start">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b px-4 py-3">
        <CardTitle className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Compagnons à la table
        </CardTitle>
        <span className="tabular text-xs text-ink-tertiary">{presentCount}</span>
      </CardHeader>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <RoundTableGlyph size={88} className="text-ink-tertiary" />
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
            La table est encore vide
          </p>
          <p className="text-[0.78rem] text-ink-tertiary">
            En attente des compagnons.
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[560px]">
          <div className="flex flex-col">
            {sorted.map((c, idx) => (
              <div
                key={c.id}
                className={`px-4 py-3 transition-colors hover:bg-popover ${
                  idx > 0 ? "border-t border-border" : ""
                }`}
              >
                <RosterItem
                  character={c}
                  isOwner={c.id === ownedId}
                  showLevel={isMJ}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}

/* -------------------------- Hero — Dernier acte -------------------------- */

function LastActHero({ item }: { item: FeedItem | null }) {
  if (!item) {
    return (
      <Card className="min-h-[280px] justify-center lg:min-h-[340px]">
        <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
          <RoundTableGlyph size={132} className="text-ink-tertiary" />
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Dernier acte
          </p>
          <p className="text-sm text-ink-tertiary">
            Aucun jet inscrit — lance le premier.
          </p>
        </CardContent>
      </Card>
    );
  }

  const breakdownPieces = buildBreakdown(item);

  // Couleur du big number — accent SCARCE : lavande réservé au crit succ, hp au crit
  // fail, endu/gris pour réussite/échec. Jet neutre (sans DD) = foreground monochrome.
  let totalClass = "text-foreground";
  if (item.isCritSucc) {
    totalClass = "text-primary";
  } else if (item.isCritFail) {
    totalClass = "text-hp";
  } else if (item.success === true) {
    totalClass = "text-endu";
  } else if (item.success === false) {
    totalClass = "text-muted-foreground";
  }

  return (
    <Card className="min-h-[280px] lg:min-h-[340px]">
      <CardHeader className="flex flex-row items-baseline justify-between gap-2">
        <CardTitle className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Dernier acte
        </CardTitle>
        <span className="tabular text-[0.62rem] uppercase tracking-[0.06em] text-ink-tertiary">
          {formatRelative(item.createdAt)}
        </span>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {item.characterName}
        </h2>
        {item.casterName && item.casterName !== item.characterName && (
          <p className="text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
            Lancé par {item.casterName}
          </p>
        )}

        <p className="tabular text-sm text-muted-foreground">{item.formula}</p>

        <div className="flex items-end justify-center gap-3">
          <span
            key={item.id}
            className={`big-number ${totalClass} ${item.isCritFail ? "italic" : ""}`}
            style={{ animation: "vital-flash 0.35s ease-out" }}
          >
            {item.total}
          </span>
          {item.dd !== null && (
            <span className="tabular mb-2 text-base uppercase tracking-[0.06em] text-ink-tertiary sm:text-lg">
              / DD {item.dd}
            </span>
          )}
        </div>

        {breakdownPieces.length > 0 && (
          <p className="tabular text-[0.72rem] text-muted-foreground">
            {breakdownPieces.join(" ")}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {item.isCritSucc && (
            <Badge className="uppercase tracking-[0.08em]">Réussite critique</Badge>
          )}
          {item.isCritFail && (
            <Badge variant="destructive" className="uppercase tracking-[0.08em] italic">
              Échec catastrophique
            </Badge>
          )}
          {item.dd !== null && !item.isCritSucc && !item.isCritFail && (
            <Badge
              variant={item.success ? "outline" : "destructive"}
              className={`uppercase tracking-[0.08em] ${
                item.success ? "border-endu/40 text-endu" : ""
              }`}
            >
              {item.success ? "Réussite" : "Échec"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
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
          <Button
            key={a}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(a)}
            data-active={active}
            className={
              active
                ? "border-primary bg-primary/15 text-primary-hover hover:bg-primary/20 hover:text-primary-hover"
                : ""
            }
          >
            <span className="text-[0.62rem] font-medium uppercase tracking-[0.1em]">
              {a}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

function DDChip({
  active,
  onClick,
  label,
  value,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  value: string | number;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`h-auto flex-col gap-0 py-1 ${
        active
          ? "border-primary bg-primary/15 text-primary-hover hover:bg-primary/20 hover:text-primary-hover"
          : ""
      }`}
    >
      <span className="text-[0.55rem] font-medium uppercase tracking-[0.1em]">
        {label}
      </span>
      <span className="tabular text-[0.72rem]">{value}</span>
    </Button>
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
        {DD_PRESETS.map((p) => (
          <DDChip
            key={p.value}
            active={value === p.value}
            onClick={() => onChange(p.value)}
            label={p.label}
            value={p.value}
          />
        ))}
        <DDChip
          active={value === "free"}
          onClick={() => onChange("free")}
          label="DD"
          value={customDD}
        />
        <DDChip
          active={value === "libre"}
          onClick={() => onChange("libre")}
          label="Libre"
          value="∞"
        />
      </div>
      {value === "free" && (
        <div className="flex items-center gap-2">
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            DD perso
          </span>
          <Input
            type="number"
            min={1}
            max={30}
            value={customDD}
            onChange={(e) =>
              onCustomChange(Math.max(1, Math.min(30, parseInt(e.target.value || "0", 10) || 1)))
            }
            onFocus={(e) => e.currentTarget.select()}
            className="tabular h-7 w-16 text-center"
          />
        </div>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[0.58rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </span>
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
    <Card className="gap-0 py-0 lg:sticky lg:top-6 lg:self-start">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Lanceur
        </CardTitle>
        <p className="text-[0.62rem] uppercase tracking-[0.14em] text-ink-tertiary">
          Jet d&apos;attribut · 2d6
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 py-4">
        {/* Section 1 — Jet d'attribut/skill */}
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Personnage</FieldLabel>
            <Select value={charA} onValueChange={setCharA}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Personnage" />
              </SelectTrigger>
              <SelectContent>
                {characters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.nom ? ` ${c.nom}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Attribut</FieldLabel>
            <AttrRadioGrid
              value={attr}
              onChange={(a) => {
                setAttr(a);
                setSkill("");
              }}
            />
          </div>

          <label className="flex flex-col gap-1.5">
            <FieldLabel>Compétence (optionnelle)</FieldLabel>
            <Select
              value={skill || "__none__"}
              onValueChange={(v) => setSkill(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Attribut seul" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Attribut seul —</SelectItem>
                {availableSkills.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Difficulté</FieldLabel>
            <DDChipsRow
              value={ddMode}
              onChange={setDdMode}
              customDD={customDD}
              onCustomChange={setCustomDD}
            />
          </div>

          <Button
            type="button"
            disabled={isPending || !charA}
            onClick={submitSkill}
            className="mt-1 w-full"
          >
            Lancer 2d6 + {attrShort[attr]}
            {skill ? " + skill" : ""}
          </Button>

          {errorA && <p className="text-[0.72rem] text-hp">{errorA}</p>}
        </div>

        <Separator />

        {/* Section 2 — Formule libre */}
        <div className="flex flex-col gap-3">
          <p className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Formule libre
          </p>

          <label className="flex flex-col gap-1.5">
            <FieldLabel>Personnage</FieldLabel>
            <Select value={charB} onValueChange={setCharB}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Personnage" />
              </SelectTrigger>
              <SelectContent>
                {characters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.nom ? ` ${c.nom}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1.5">
            <FieldLabel>Formule</FieldLabel>
            <Input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="2d6+5, 2d6+INT, 1d100+PSY"
              className="tabular"
            />
          </label>

          <Button
            type="button"
            variant="secondary"
            disabled={isPending || !formula.trim() || !charB}
            onClick={submitFormula}
            className="w-full"
          >
            Lancer la formule
          </Button>

          {errorB && <p className="text-[0.72rem] text-hp">{errorB}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------- Carnet des jets — list-portfolio -------------------------- */

function CarnetRow({ item }: { item: FeedItem }) {
  const breakdownPieces = buildBreakdown(item);

  // Couleur du total
  let totalClass = "text-foreground";
  if (item.isCritSucc) {
    totalClass = "text-primary";
  } else if (item.isCritFail) {
    totalClass = "text-hp italic";
  } else if (item.success === true) {
    totalClass = "text-endu";
  } else if (item.success === false) {
    totalClass = "text-muted-foreground";
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Gauche : perso + formule + breakdown */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h4 className="truncate text-sm font-medium tracking-tight text-foreground">
            {item.characterName}
          </h4>
          {item.casterName && item.casterName !== item.characterName && (
            <span className="text-[0.6rem] uppercase tracking-[0.12em] text-ink-tertiary">
              · {item.casterName}
            </span>
          )}
          <span className="tabular ml-auto text-[0.6rem] uppercase tracking-[0.1em] text-ink-tertiary">
            {formatRelative(item.createdAt)}
          </span>
        </div>
        <p className="tabular mt-0.5 text-[0.72rem] text-muted-foreground">
          {item.formula}
          {breakdownPieces.length > 0 && (
            <span className="text-ink-tertiary"> · {breakdownPieces.join(" ")}</span>
          )}
        </p>
      </div>

      {/* Droite : total + badge */}
      <div className="flex shrink-0 items-baseline gap-3">
        <div className="flex items-baseline gap-1">
          <span className={`tabular text-2xl font-semibold leading-none sm:text-3xl ${totalClass}`}>
            {item.total}
          </span>
          {item.dd !== null && (
            <span className="tabular text-[0.65rem] text-ink-tertiary">/ {item.dd}</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {item.isCritSucc && (
            <Badge className="uppercase tracking-[0.06em]">Crit</Badge>
          )}
          {item.isCritFail && (
            <Badge variant="destructive" className="uppercase tracking-[0.06em] italic">
              Désastre
            </Badge>
          )}
          {item.dd !== null && !item.isCritSucc && !item.isCritFail && (
            <Badge
              variant={item.success ? "outline" : "destructive"}
              className={`uppercase tracking-[0.06em] ${
                item.success ? "border-endu/40 text-endu" : ""
              }`}
            >
              {item.success ? "Réussite" : "Échec"}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function Carnet({ items }: { items: FeedItem[] }) {
  return (
    <Card className="min-w-0 gap-0 py-0">
      <CardHeader className="sticky top-0 z-10 flex flex-row items-baseline justify-between gap-2 rounded-t-lg border-b bg-card px-4 py-3">
        <CardTitle className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Carnet des jets
        </CardTitle>
        <span className="tabular text-[0.62rem] uppercase tracking-[0.06em] text-ink-tertiary">
          {items.length} / 30
        </span>
      </CardHeader>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
          <RoundTableGlyph size={88} className="text-ink-tertiary" />
          <p className="text-sm text-ink-tertiary">
            Aucun jet n&apos;a été inscrit. Lance le premier.
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="flex flex-col">
            {items.map((it, idx) => (
              <div
                key={it.id}
                className={`px-4 py-3 transition-colors hover:bg-popover ${
                  idx > 0 ? "border-t border-border" : ""
                }`}
              >
                <CarnetRow item={it} />
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
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

      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:gap-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RoundTableGlyph size={40} className="text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Plateau de jeu
              </h1>
              <p className="mt-0.5 text-[0.78rem] text-muted-foreground">
                Session ouverte · {presentCount} {presentCount > 1 ? "joueurs" : "joueur"}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={isMJ ? "/mj" : "/me"}>
                {isMJ ? "Tableau MJ →" : "Ma fiche →"}
              </Link>
            </Button>
          </nav>
        </header>

        {/* Grille principale 3 colonnes */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:gap-6">
          {/* Roster — gauche */}
          <Roster
            characters={characters}
            isMJ={isMJ}
            ownedId={ownedCharacterId}
          />

          {/* Hero "Dernier acte" — centre */}
          <LastActHero item={initialRolls[0] ?? null} />

          {/* Lanceur — droite */}
          {characters.length > 0 ? (
            <Launcher
              characters={characters}
              defaultCharacterId={defaultCharacterId}
            />
          ) : (
            <Card className="min-h-[200px] items-center justify-center">
              <CardContent className="text-center text-sm text-muted-foreground">
                Aucun personnage à la table.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Carnet des jets — pleine largeur */}
        <Carnet items={initialRolls} />
      </div>
    </main>
  );
}
