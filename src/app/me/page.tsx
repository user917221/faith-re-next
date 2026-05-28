import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/me");

  return (
    <main className="min-h-screen bg-[#0a0c15] px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Ma fiche</h1>
        <p className="mt-2 text-sm text-white/60">
          Bonjour <strong>{session.user.name}</strong> ({session.user.role}).
        </p>
        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/60">
          <p>
            <strong>Prochaine session :</strong> rendu de la fiche dynamique
            (skills +/-, lanceur 2d6, console Discord) — composant à migrer
            depuis le compagnon Vite vers React.
          </p>
        </div>
      </div>
    </main>
  );
}
