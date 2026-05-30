"use client";

/**
 * TableView — vue « table » du cockpit MJ : tous les personnages en même temps.
 * Chaque carte montre les 4 vitaux (Santé / Mental / Endurance / Flux) en barres
 * linéaires compactes + steppers −/+ éditables inline (le MJ ajuste les PV de
 * n'importe quel perso sans changer de sélection), et ses conditions actives en
 * chips lecture seule. Câblé sur les server actions updateVital / updateFlux
 * (par characterId) + router.refresh() dans une transition.
 *
 * Précédents réutilisés : la ligne dense du roster (avatar + barre HP colorée
 * selon l'état, bleu si PV négatifs), .vital-track / .vital-track-fill, le
 * modèle d'ajusteur −/+ de VitalGauge (en plus compact), KIND_META des
 * conditions. Pas de jauges circulaires (trop lourd ×16).
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type {
  Character,
  ConditionItem,
  ConditionKind,
} from "@/components/character-sheet/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { avatarFallbackStyle, initialsOf } from "@/lib/avatar";
import { updateVital, updateFlux } from "@/lib/actions";

/** Couleurs des conditions — alignées sur KIND_META de ConditionsPanel. */
const KIND_META: Record<ConditionKind, { label: string; rgb: string }> = {
  buff: { label: "Buff", rgb: "130,169,107" }, // --endu
  debuff: { label: "Debuff", rgb: "200,95,80" }, // --hp
  wound: { label: "Blessure", rgb: "204,132,88" }, // orange
  focus: { label: "Focus", rgb: "111,166,184" }, // --mhp
  neutral: { label: "Marqueur", rgb: "150,150,168" }, // gris
};

function pct(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

/** Vitaux pilotés par updateVital(type) — Santé, Mental, Endurance. */
type VitalType = "hp" | "mental" | "endu";

type VitalSpec = {
  /** "hp" | "mental" | "endu" → updateVital ; "flux" → updateFlux. */
  kind: VitalType | "flux";
  label: string;
  current: number;
  max: number;
  /** Couleur sémantique du vital (var token). */
  color: string;
  /** Pas du stepper. */
  step: number;
};

/* ============================================================
 * VitalRow — une ligne de vital : label + barre + valeur + stepper −/+.
 * Barre teintée de la couleur du vital, rouge sous 25 %, bleu si négatif
 * (système de mort, comme le roster). Désactivé pendant la transition.
 * ============================================================ */
function VitalRow({
  spec,
  onAdjust,
  pending,
}: {
  spec: VitalSpec;
  onAdjust: (kind: VitalSpec["kind"], delta: number) => void;
  pending: boolean;
}) {
  const { label, current, max, color, step } = spec;
  const ratio = pct(current, max);
  const isNegative = current < 0;
  const isLow = !isNegative && ratio < 25 && current > 0;
  // Bleu (--mhp) si PV négatifs, rouge (--hp) si bas, sinon teinte du vital.
  const fillColor = isNegative ? "var(--mhp)" : isLow ? "var(--hp)" : color;
  const valueColor = isNegative
    ? "var(--mhp)"
    : isLow
      ? "var(--hp)"
      : "var(--foreground)";

  return (
    <div className="flex items-center gap-2.5">
      <span className="eyebrow w-9 shrink-0">{label}</span>

      <div className="vital-track min-w-0 flex-1">
        <div
          className="vital-track-fill"
          style={{ width: `${ratio}%`, color: fillColor, background: fillColor }}
        />
      </div>

      <span
        className="shrink-0 font-mono text-[11px] tabular-nums slashed-zero"
        style={{ color: valueColor }}
      >
        {current}
        <span className="text-ink-tertiary/60">/{max}</span>
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onAdjust(spec.kind, -step)}
          disabled={pending}
          aria-label={`Retirer ${step} à ${label}`}
          title={`−${step}`}
          className="stepper-btn flex size-6 items-center justify-center text-foreground-muted transition-colors hover:text-foreground disabled:opacity-40"
        >
          <Minus className="size-3" />
        </button>
        <button
          type="button"
          onClick={() => onAdjust(spec.kind, step)}
          disabled={pending}
          aria-label={`Ajouter ${step} à ${label}`}
          title={`+${step}`}
          className="stepper-btn flex size-6 items-center justify-center text-foreground-muted transition-colors hover:text-foreground disabled:opacity-40"
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * ConditionChips — conditions actives en chips lecture seule (KIND_META).
 * « — » discret si aucune.
 * ============================================================ */
function ConditionChips({ conditions }: { conditions: ConditionItem[] }) {
  if (conditions.length === 0) {
    return <span className="text-xs text-foreground-subtle">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {conditions.map((c) => {
        const meta = KIND_META[c.kind];
        const mod = c.diceModifier ?? 0;
        return (
          <Badge
            key={c.id}
            variant="outline"
            className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-2xs font-medium"
            style={{
              background: `rgba(${meta.rgb},0.12)`,
              borderColor: `rgba(${meta.rgb},0.32)`,
              color: `rgb(${meta.rgb})`,
            }}
            title={meta.label}
          >
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: `rgb(${meta.rgb})` }}
              aria-hidden
            />
            <span>{c.label}</span>
            {mod !== 0 && (
              <span className="font-mono text-[10px] tabular-nums opacity-80">
                {mod > 0 ? `+${mod}` : mod}
              </span>
            )}
          </Badge>
        );
      })}
    </div>
  );
}

/* ============================================================
 * TableCard — une carte perso : en-tête (avatar + identité + tier) + 4 vitaux
 * + conditions. Toute l'édition inline passe par une transition partagée.
 * ============================================================ */
function TableCard({ character }: { character: Character }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const adjust = (kind: VitalSpec["kind"], delta: number) => {
    startTransition(async () => {
      try {
        const res =
          kind === "flux"
            ? await updateFlux(character.id, delta)
            : await updateVital(character.id, kind, delta);
        if (res && res.ok === false) {
          toast.error(res.reason);
          return;
        }
        router.refresh();
      } catch (e) {
        toast.error("Ajustement impossible", {
          description: e instanceof Error ? e.message : undefined,
        });
      }
    });
  };

  const vitals: VitalSpec[] = [
    {
      kind: "hp",
      label: "Santé",
      current: character.currentHp,
      max: character.maxHp,
      color: "var(--hp)",
      step: 5,
    },
    {
      kind: "mental",
      label: "Mental",
      current: character.currentMental,
      max: character.maxMental,
      color: "var(--mhp)",
      step: 5,
    },
    {
      kind: "endu",
      label: "Endu",
      current: character.currentEndurance,
      max: character.maxEndurance,
      color: "var(--endu)",
      step: 10,
    },
    {
      kind: "flux",
      label: "Flux",
      current: character.currentFlux,
      max: character.maxFlux,
      color: "var(--gauge-flux)",
      step: 10,
    },
  ];

  return (
    <article className="campaign-panel flex flex-col gap-3 p-4">
      {/* En-tête : avatar + LED présence + identité + niveau + tier */}
      <header className="flex items-center gap-3">
        <span className="relative shrink-0">
          <Avatar size="default" className="rounded-md">
            <AvatarImage src={character.avatarUrl ?? undefined} alt={character.name} />
            <AvatarFallback
              className="rounded-md text-xs"
              style={avatarFallbackStyle(character.name)}
            >
              {initialsOf(character.name, character.nom)}
            </AvatarFallback>
          </Avatar>
          <span
            aria-hidden
            className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-card ${
              character.isPresent ? "presence-led-on" : "presence-led-off"
            }`}
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium tracking-tight text-foreground">
            {character.name}
            {character.nom ? (
              <span className="font-normal text-ink-tertiary"> {character.nom}</span>
            ) : null}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
            Niv.&nbsp;{character.level}
          </p>
        </div>

        <Badge variant="outline" className="tabular shrink-0 text-muted-foreground">
          {character.tier}
        </Badge>
      </header>

      {/* 4 vitaux empilés — barres linéaires + steppers inline */}
      <div className="flex flex-col gap-2">
        {vitals.map((spec) => (
          <VitalRow
            key={spec.kind}
            spec={spec}
            onAdjust={adjust}
            pending={pending}
          />
        ))}
      </div>

      {/* Conditions actives — chips lecture seule */}
      <footer className="flex items-center gap-2 border-t border-border pt-3">
        <span className="eyebrow shrink-0">Conditions</span>
        {pending && (
          <Loader2 className="size-3 animate-spin text-primary" aria-hidden />
        )}
        <div className="ml-auto min-w-0">
          <ConditionChips conditions={character.conditions} />
        </div>
      </footer>
    </article>
  );
}

/* ============================================================
 * TableView — grille de cartes (1 col en étroit, 2 dès qu'il y a la place).
 * ============================================================ */
export function TableView({ characters }: { characters: Character[] }) {
  if (characters.length === 0) {
    return (
      <div className="campaign-panel p-10 text-center text-sm text-foreground-subtle">
        Aucun personnage à afficher.
      </div>
    );
  }

  return (
    <section aria-label="Vue table — vitaux de tous les personnages">
      <header className="mb-4 flex items-baseline justify-between gap-2">
        <p className="label-grimoire">Vue table</p>
        <span className="tabular text-xs text-ink-tertiary">
          {characters.length} personnage{characters.length > 1 ? "s" : ""}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {characters.map((c) => (
          <TableCard key={c.id} character={c} />
        ))}
      </div>
    </section>
  );
}
