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

  return (
    <main className="relative z-[2] min-h-screen px-6 py-10">
      <div className="mx-auto mb-4 max-w-7xl">
        <Link
          href="/plateau"
          className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim transition-colors hover:text-gold-aged"
        >
          ← Plateau
        </Link>
      </div>
      <header className="mx-auto mb-8 flex max-w-7xl items-center justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.22em] text-gold-aged">
            Tableau MJ
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-wide text-parchment">
            FAITH : RE — Vue privée
          </h1>
        </div>
        <span className="font-display flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.22em] text-gold-aged before:inline-block before:h-px before:w-6 before:bg-gold-soft after:inline-block after:h-px after:w-6 after:bg-gold-soft">
          Endurance révélée
        </span>
      </header>

      <div className="mx-auto max-w-7xl">
        <PendingTrainingPanel requests={pendingRequests} />
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          <p className="label-grimoire mb-2 block">Roster</p>
          {allChars.map((c) => {
            const isActive = c.id === selectedId;
            return (
              <Link
                key={c.id}
                href={`/mj?id=${c.id}`}
                className={`card-grimoire block transition ${
                  isActive
                    ? "!border-gold-aged/50 shadow-[0_0_22px_-8px_rgba(202,161,90,0.4)]"
                    : "hover:!border-gold-aged/25"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-display tracking-wide ${
                      isActive ? "text-gold-aged" : "text-parchment"
                    }`}
                  >
                    {c.name}
                    {c.nom && (
                      <span className="text-parchment-dim"> {c.nom}</span>
                    )}
                  </span>
                  <span className="font-display tabular rounded-[--radius-xs] border border-gold-aged/30 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.15em] text-gold-aged">
                    Niv. {c.level}
                  </span>
                </div>
                <p className="tabular mt-2 text-[0.7rem] text-parchment-mute">
                  HP {c.currentHp}/{c.maxHp} · MHP {c.currentMental}/{c.maxMental}
                </p>
                <p className="tabular text-[0.7rem] text-parchment-mute">
                  Endu {c.currentEndurance}/{c.maxEndurance}
                </p>
              </Link>
            );
          })}
        </aside>

        <section>
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
