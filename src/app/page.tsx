import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#0a0c15] px-6 text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">FAITH : RE</h1>
        <p className="mt-3 text-sm uppercase tracking-[0.3em] text-white/40">
          Compagnon de Jeu &amp; Fiches Dynamiques
        </p>
      </div>

      {session?.user ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-sm text-white/60">Connecté en tant que</p>
          <p className="mt-1 text-lg font-semibold">{session.user.name}</p>
          <p className="mt-1 inline-block rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
            Rôle : {session.user.role}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {session.user.role === "mj" ? (
              <Link
                href="/mj"
                className="rounded-lg bg-cyan-500 px-6 py-3 font-medium text-black hover:bg-cyan-400"
              >
                Accéder au tableau MJ
              </Link>
            ) : (
              <Link
                href="/me"
                className="rounded-lg bg-cyan-500 px-6 py-3 font-medium text-black hover:bg-cyan-400"
              >
                Voir ma fiche
              </Link>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="w-full rounded-lg border border-white/10 px-6 py-2 text-sm text-white/60 hover:bg-white/5"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      ) : (
        <Link
          href="/signin"
          className="rounded-lg bg-[#5865F2] px-8 py-3 font-medium text-white hover:bg-[#4752c4]"
        >
          Connexion Discord
        </Link>
      )}
    </main>
  );
}
