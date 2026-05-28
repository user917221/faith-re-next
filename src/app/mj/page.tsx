import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MjDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/mj");
  if (session.user.role !== "mj") redirect("/me");

  return (
    <main className="min-h-screen bg-[#0a0c15] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tableau MJ</h1>
          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
            Vue privée
          </span>
        </div>
        <p className="mt-2 text-sm text-white/60">
          Tu vois toutes les fiches, incluant l'endurance (donnée privée).
        </p>
        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/60">
          <p>
            <strong>Prochaine session :</strong> liste roster + accès aux fiches
            + édition skills / XP / entraînements + console Discord live.
          </p>
        </div>
      </div>
    </main>
  );
}
