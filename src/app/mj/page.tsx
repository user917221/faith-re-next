import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { loadAllCharacters, loadCharacter } from "@/lib/load-character";
import { listTrainingRequestsForMJ } from "@/lib/actions";
import { MJCharacterClient, PendingTrainingPanel } from "./client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function MjDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/mj");
  if (session.user.role !== "mj") redirect("/me");

  const [allChars, params, pendingRequests] = await Promise.all([
    loadAllCharacters(),
    searchParams,
    listTrainingRequestsForMJ(),
  ]);
  const selectedId = params.id ?? allChars[0]?.id;
  const selected = selectedId ? await loadCharacter(selectedId) : null;
  const presentCount = allChars.filter((c) => c.isPresent).length;

  return (
    <main className="relative z-[2] min-h-screen px-6 py-8">
      <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-4">
        {/* ========== HEADER (col-span-12) ========== */}
        <header className="col-span-12 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-5">
            <Link
              href="/plateau"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Plateau
            </Link>
            <Separator orientation="vertical" className="h-5" />
            <div>
              <p className="label-grimoire">Tableau MJ</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                FAITH : RE — Vue privée
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="uppercase tracking-wide text-muted-foreground">
              Endurance révélée
            </Badge>
            <Button asChild variant="outline">
              <Link href="/me">Vue joueur</Link>
            </Button>
          </div>
        </header>

        {/* ========== ROSTER SIDEBAR (col-span-3) ========== */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="sticky top-6 overflow-hidden rounded-lg border border-border bg-card">
            <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <p className="label-grimoire">Roster</p>
              <span className="tabular text-xs text-ink-tertiary">
                <span className="text-foreground">{allChars.length}</span> / 4
              </span>
            </header>

            <nav className="list-portfolio" aria-label="Liste des personnages">
              {allChars.map((c) => {
                const isActive = c.id === selectedId;
                const hpPct = Math.max(0, Math.min(100, (c.currentHp / c.maxHp) * 100));
                const hpCritical = hpPct < 25;
                return (
                  <Link
                    key={c.id}
                    href={`/mj?id=${c.id}`}
                    className={`group block !py-3 !px-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive ? "!border-l-primary bg-muted" : ""
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {/* Row 1 — LED + name + Niv badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            c.isPresent ? "presence-led-on" : "presence-led-off"
                          }`}
                        />
                        <span
                          className={`truncate text-sm font-medium tracking-tight ${
                            isActive ? "text-foreground" : "text-ink-muted group-hover:text-foreground"
                          }`}
                        >
                          {c.name}
                        </span>
                      </span>
                      <Badge variant="outline" className="shrink-0 tabular tracking-wide text-muted-foreground">
                        Niv. {c.level}
                      </Badge>
                    </div>

                    {/* Row 2 — mini HP bar + numeric */}
                    <div className="mt-2 flex items-center gap-2">
                      <Progress
                        value={hpPct}
                        className={`flex-1 [&_[data-slot=progress-indicator]]:transition-[transform,width] [&_[data-slot=progress-indicator]]:duration-300 ${
                          hpCritical
                            ? "[&_[data-slot=progress-indicator]]:bg-hp"
                            : "[&_[data-slot=progress-indicator]]:bg-hp/80"
                        }`}
                      />
                      <span className="tabular shrink-0 text-[0.62rem] text-ink-tertiary">
                        <span className={hpCritical ? "text-hp" : "text-muted-foreground"}>
                          {c.currentHp}
                        </span>
                        <span className="text-ink-tertiary">/{c.maxHp}</span>
                      </span>
                    </div>

                    {/* Row 3 — inline mini-stats */}
                    <p className="tabular mt-1.5 flex items-center gap-2 text-[0.6rem] text-ink-tertiary">
                      <span>
                        <span className="text-mhp/80">M</span> {c.currentMental}
                        <span className="text-ink-tertiary">/{c.maxMental}</span>
                      </span>
                      <span aria-hidden className="text-border">·</span>
                      <span>
                        <span className="text-endu/80">E</span> {c.currentEndurance}
                        <span className="text-ink-tertiary">/{c.maxEndurance}</span>
                      </span>
                    </p>
                  </Link>
                );
              })}
            </nav>

            {/* Footer — presence stats */}
            <footer className="border-t border-border px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="label-grimoire">Présents</span>
                <span className="tabular text-xs text-foreground">
                  <span className="text-endu">{presentCount}</span>
                  <span className="text-ink-tertiary"> / {allChars.length}</span>
                </span>
              </div>
            </footer>
          </div>
        </aside>

        {/* ========== PENDING TRAINING (col-span-9) ========== */}
        <section className="col-span-12 lg:col-span-9">
          <PendingTrainingPanel requests={pendingRequests} />
        </section>

        {/* ========== SELECTED CHARACTER (col-span-12) ========== */}
        <section className="col-span-12">
          {selected ? (
            <MJCharacterClient character={selected} />
          ) : (
            <Card>
              <CardContent className="p-10 text-center text-sm text-ink-tertiary">
                Aucun personnage. Run{" "}
                <code className="tabular rounded-sm border border-border bg-popover px-1 py-0.5 text-muted-foreground">
                  pnpm db:seed
                </code>{" "}
                pour initialiser le roster.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
