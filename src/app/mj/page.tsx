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
    <main className="min-h-screen bg-[#0a0c15] px-6 py-10 text-white">
      <header className="mx-auto mb-8 flex max-w-7xl items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Tableau MJ</p>
          <h1 className="text-2xl font-bold">FAITH : RE — Vue privée</h1>
        </div>
        <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
          Endurance révélée
        </span>
      </header>

      <div className="mx-auto max-w-7xl">
        <PendingTrainingPanel requests={pendingRequests} />
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-white/40">Roster</p>
          {allChars.map((c) => {
            const isActive = c.id === selectedId;
            return (
              <Link
                key={c.id}
                href={`/mj?id=${c.id}`}
                className={`block rounded-xl border p-3 transition ${
                  isActive
                    ? "border-cyan-400/40 bg-cyan-400/[0.06]"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{c.name}{c.nom && ` ${c.nom}`}</span>
                  <span className="rounded-md bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-300">
                    Niv. {c.level}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/40">
                  HP {c.currentHp}/{c.maxHp} · MHP {c.currentMental}/{c.maxMental}
                </p>
                <p className="text-xs text-white/40">
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
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-white/50">
              Aucun personnage. Run `pnpm db:seed` pour initialiser le roster.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
