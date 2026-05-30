"use client";

/**
 * SessionLogsView — onglet « Logs de session » (#88), lecture seule.
 *
 * Affiche les jets archivés (via « Fin de session » sur /plateau), groupés par
 * séance (gameSessionId), du plus récent au plus ancien. Chaque entrée :
 *   [ formule (mono) ] → [ total (gras) ] | [ dégâts ] par [ auteur/perso ]
 *   à [ HH:MM:SS ].
 *
 * Heure : toujours Europe/Paris, locale fr-FR (avec accents : avr., déc., …).
 * Réutilise .campaign-panel / .campaign-header-line / .campaign-subpanel.
 */

import { useMemo } from "react";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SessionLogEntry } from "@/lib/campaign";

// Formatage Europe/Paris fr-FR (date longue) — pour le sous-titre des groupes.
const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

// Heure seule (HH:MM:SS) — pour chaque entrée.
const TIME_FMT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

type Group = {
  key: string;
  sessionNumber: number;
  endedAt: Date;
  entries: SessionLogEntry[];
};

function groupBySession(logs: SessionLogEntry[]): Group[] {
  const map = new Map<string, Group>();
  for (const log of logs) {
    // Clé : gameSessionId si présent, sinon repli sur le numéro + endedAt.
    const key =
      log.gameSessionId ??
      `n${log.sessionNumber}-${new Date(log.endedAt).getTime()}`;
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        sessionNumber: log.sessionNumber,
        endedAt: new Date(log.endedAt),
        entries: [],
      };
      map.set(key, g);
    }
    g.entries.push(log);
    // Conserve l'instant de clôture le plus récent du groupe.
    const t = new Date(log.endedAt);
    if (t > g.endedAt) g.endedAt = t;
  }
  // Groupes triés par endedAt DESC (récents en haut).
  return Array.from(map.values()).sort(
    (a, b) => b.endedAt.getTime() - a.endedAt.getTime(),
  );
}

function LogEntryRow({ entry }: { entry: SessionLogEntry }) {
  // Entrée de dégâts subis (perte de PV) — pas un jet de dés. Identifiée par
  // damageValue non-null (les jets archivés ont toujours damageValue null).
  if (entry.damageValue !== null) {
    const src =
      entry.casterName && entry.casterName !== entry.characterName
        ? entry.casterName
        : null;
    return (
      <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 py-2">
        <span className="tabular font-mono text-2xs uppercase tracking-wide text-hp">
          Dégâts
        </span>
        <span className="text-ink-tertiary">→</span>
        <span className="text-sm font-medium text-foreground">
          {entry.characterName}
        </span>
        <span className="tabular text-sm font-semibold text-hp">
          −{entry.damageValue} PV
        </span>
        {src && (
          <span className="text-2xs text-ink-tertiary">
            par <span className="text-muted-foreground">{src}</span>
          </span>
        )}
        <span className="tabular ml-auto text-3xs uppercase tracking-[0.08em] text-ink-tertiary">
          {TIME_FMT.format(new Date(entry.rolledAt))}
        </span>
      </li>
    );
  }

  const totalClass = entry.isCritSucc
    ? "text-primary"
    : entry.isCritFail
      ? "text-hp italic"
      : "text-foreground";
  const author =
    entry.characterId === null ? "[Dés publics]" : entry.characterName;
  const caster =
    entry.casterName && entry.casterName !== entry.characterName
      ? entry.casterName
      : null;

  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 py-2">
      <span className="tabular font-mono text-2xs text-muted-foreground">
        {entry.diceFormula}
      </span>
      <span className="text-ink-tertiary">→</span>
      <span className={`tabular text-sm font-semibold ${totalClass}`}>
        {entry.diceTotal}
      </span>
      {entry.dd !== null && (
        <span className="tabular text-2xs text-ink-tertiary">/ DD {entry.dd}</span>
      )}
      {entry.damageValue !== null && entry.damageValue > 0 && (
        <span className="tabular text-2xs text-hp">
          · {entry.damageValue} dégâts
        </span>
      )}
      <span className="text-2xs text-ink-tertiary">
        par <span className="text-muted-foreground">{author}</span>
        {caster && <span className="text-ink-tertiary"> ({caster})</span>}
      </span>
      <span className="tabular ml-auto text-3xs uppercase tracking-[0.08em] text-ink-tertiary">
        {TIME_FMT.format(new Date(entry.rolledAt))}
      </span>
    </li>
  );
}

export function SessionLogsView({
  logs,
}: {
  campaignId: string;
  logs: SessionLogEntry[];
  sessionDate: string;
}) {
  const groups = useMemo(() => groupBySession(logs), [logs]);

  return (
    <div className="flex flex-col gap-4">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History size={18} className="text-primary" />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              Logs de session
            </h1>
            <p className="text-2xs text-muted-foreground">
              {logs.length} entrée{logs.length > 1 ? "s" : ""} archivée
              {logs.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="campaign-panel px-4 py-10 text-center text-sm text-foreground-subtle">
          Aucun log. Les jets s&apos;archivent ici à la « Fin de session » depuis
          le plateau.
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.key} className="campaign-panel">
            <header className="campaign-header-line flex items-center justify-between gap-2 px-4 py-2.5">
              <span className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Session {g.sessionNumber}
                </span>
                <Badge
                  variant="outline"
                  className="tabular text-2xs text-ink-tertiary"
                >
                  {g.entries.length} entrée{g.entries.length > 1 ? "s" : ""}
                </Badge>
              </span>
              <span className="tabular text-3xs uppercase tracking-[0.08em] text-ink-tertiary">
                {DATE_FMT.format(g.endedAt)}
              </span>
            </header>
            <ul className="divide-y divide-border">
              {g.entries.map((entry) => (
                <LogEntryRow key={entry.id} entry={entry} />
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
