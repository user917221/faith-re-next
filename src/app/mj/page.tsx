import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { loadAllCharacters, loadCharacter } from "@/lib/load-character";
import { listTrainingRequestsForMJ } from "@/lib/actions";
import { MJCharacterClient, PendingTrainingPanel } from "./client";

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
        <header className="col-span-12 flex flex-wrap items-center justify-between gap-4 border-b border-gold-soft/15 pb-5">
          <div className="flex items-baseline gap-5">
            <Link
              href="/plateau"
              className="font-display text-[0.7rem] uppercase tracking-[0.2em] text-parchment-dim transition-colors hover:text-gold-aged"
            >
              ← Plateau
            </Link>
            <div className="h-5 w-px bg-gold-soft/25" aria-hidden />
            <div>
              <p className="label-grimoire">Tableau MJ</p>
              <h1 className="font-display mt-1 text-2xl font-bold tracking-wide text-parchment">
                FAITH : RE — Vue privée
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display flex items-center gap-2 rounded-[--radius-xs] border border-gold-aged/30 px-3 py-1 text-[0.62rem] uppercase tracking-[0.22em] text-gold-aged">
              <span aria-hidden className="sigil-glow text-gold-bright">⚜</span>
              Endurance révélée
            </span>
            <Link
              href="/me"
              className="btn-ghost focus-grimoire"
            >
              Vue joueur
            </Link>
          </div>
        </header>

        {/* ========== ROSTER SIDEBAR (col-span-3) ========== */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="card-grimoire sticky top-6 p-0">
            <header className="flex items-center justify-between gap-2 border-b border-gold-soft/12 px-4 py-3">
              <p className="label-grimoire">Roster</p>
              <span className="font-display tabular text-[0.62rem] uppercase tracking-[0.18em] text-parchment-mute">
                <span className="text-gold-aged">{allChars.length}</span> / 4
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
                    className={`focus-grimoire group block !py-3 !px-4 ${
                      isActive
                        ? "!bg-ink-far !border-l-gold-aged"
                        : ""
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {/* Row 1 — LED + name + Niv badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span
                          aria-hidden
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            c.isPresent ? "presence-led-on" : "presence-led-off"
                          }`}
                        />
                        <span
                          className={`font-display truncate tracking-wide ${
                            isActive ? "text-gold-aged" : "text-parchment group-hover:text-gold-bright"
                          }`}
                        >
                          {c.name}
                        </span>
                      </span>
                      <span className="font-display tabular shrink-0 rounded-[--radius-xs] border border-gold-aged/25 px-1.5 py-px text-[0.58rem] uppercase tracking-[0.15em] text-gold-aged">
                        Niv. {c.level}
                      </span>
                    </div>

                    {/* Row 2 — mini HP bar + numeric */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="relative h-1 flex-1 overflow-hidden rounded-[--radius-xs] bg-ink-edge/60">
                        <div
                          className={`absolute inset-y-0 left-0 transition-[width] duration-300 ${
                            hpCritical ? "bg-blood-dried" : "bg-blood-dried/85"
                          }`}
                          style={{ width: `${hpPct}%` }}
                        />
                      </div>
                      <span className="tabular shrink-0 text-[0.62rem] text-parchment-mute">
                        <span className={hpCritical ? "text-blood-dried" : "text-parchment-dim"}>
                          {c.currentHp}
                        </span>
                        <span className="text-parchment-mute">/{c.maxHp}</span>
                      </span>
                    </div>

                    {/* Row 3 — inline mini-stats */}
                    <p className="tabular mt-1.5 flex items-center gap-2 text-[0.6rem] text-parchment-mute">
                      <span>
                        <span className="text-amethyst/75">M</span> {c.currentMental}
                        <span className="text-parchment-faint">/{c.maxMental}</span>
                      </span>
                      <span aria-hidden className="text-gold-soft/40">·</span>
                      <span>
                        <span className="text-celadon/75">E</span> {c.currentEndurance}
                        <span className="text-parchment-faint">/{c.maxEndurance}</span>
                      </span>
                    </p>
                  </Link>
                );
              })}
            </nav>

            {/* Footer — presence stats */}
            <footer className="border-t border-gold-soft/12 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-[0.62rem] uppercase tracking-[0.2em] text-parchment-mute">
                  Présents
                </span>
                <span className="font-display tabular text-[0.7rem] text-parchment">
                  <span className="text-celadon">{presentCount}</span>
                  <span className="text-parchment-faint"> / {allChars.length}</span>
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
            <div className="card-grimoire p-10 text-center text-sm text-parchment-mute">
              Aucun personnage. Run{" "}
              <code className="tabular rounded-[--radius-xs] border border-gold-aged/15 bg-ink-deep px-1 py-0.5 text-gold-aged">
                pnpm db:seed
              </code>{" "}
              pour initialiser le roster.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
