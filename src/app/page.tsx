import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="relative z-[2] flex min-h-screen flex-col items-center justify-center gap-10 px-6">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold tracking-wide text-gold-aged">
          FAITH : RE
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.3em] text-parchment-mute">
          Compagnon de Jeu &amp; Fiches Dynamiques
        </p>
      </div>

      {session?.user ? (
        <div className="card-grimoire w-full max-w-sm text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-parchment-mute">
            Connecté en tant que
          </p>
          <p className="mt-1 font-display text-lg text-parchment">
            {session.user.name}
          </p>
          <p className="font-display mt-2 inline-block rounded-[--radius-sm] border border-gold-aged/30 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-gold-aged">
            Rôle&nbsp;: {session.user.role}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {session.user.role === "mj" ? (
              <Link href="/mj" className="btn-grimoire text-center">
                Accéder au tableau MJ
              </Link>
            ) : (
              <Link href="/me" className="btn-grimoire text-center">
                Voir ma fiche
              </Link>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="btn-ghost w-full">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      ) : (
        <Link
          href="/signin"
          className="rounded-[--radius-sm] bg-[#5865F2] px-8 py-3 font-medium text-white transition hover:bg-[#4752c4]"
        >
          Connexion Discord
        </Link>
      )}
    </main>
  );
}
