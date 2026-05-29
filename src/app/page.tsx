import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";
import { ConstellationGlyph } from "@/components/glyphs";

// Lit la session côté serveur — rendu dynamique.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="relative z-[2] min-h-screen px-6 py-10 md:py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-10 lg:items-stretch">
        {/* ============================================================
            HERO — col-span-6 (60%) : glyph dominant + titre rituel
            ============================================================ */}
        <section className="card-hero relative flex min-h-[480px] flex-col items-center justify-center gap-9 text-center lg:col-span-6 lg:min-h-[560px]">
          {/* Glyph dominant — rotation lente + halo pulse */}
          <div className="text-gold-aged glyph-rotate">
            <div className="sigil-glow">
              <ConstellationGlyph size={200} />
            </div>
          </div>

          {/* Titre + tagline */}
          <div className="flex flex-col items-center gap-4">
            <p className="label-grimoire">Grimoire de campagne</p>
            <h1 className="font-display text-7xl font-bold leading-none tracking-[0.04em] text-gold-aged drop-shadow-[0_0_28px_rgba(202,161,90,0.22)]">
              FAITH&nbsp;:&nbsp;RE
            </h1>
            <p className="font-display max-w-md text-sm uppercase tracking-[0.18em] text-parchment-dim">
              Compagnon de jeu &amp; fiches rituelles
            </p>
          </div>

          {/* Mini sigil — mark de séparation contemplatif */}
          <div className="flex items-center gap-3 text-gold-soft">
            <span className="h-px w-12 bg-gold-soft/60" />
            <span className="text-base">✦</span>
            <span className="h-px w-12 bg-gold-soft/60" />
          </div>
        </section>

        {/* ============================================================
            AUTH — col-span-4 (40%) : convocation ou identité
            ============================================================ */}
        {user ? (
          <section className="card-hero flex flex-col gap-6 lg:col-span-4">
            <header className="flex flex-col gap-3">
              <p className="label-grimoire">Compagnon</p>
              <p className="font-display text-2xl tracking-wide text-parchment">
                {user.name}
              </p>
              <p className="font-display inline-block w-fit rounded-[--radius-xs] border border-gold-aged/35 bg-gold-aged/10 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-gold-aged">
                Rôle&nbsp;: {user.role}
              </p>
            </header>

            <div className="sigil-divider !my-0">
              <span className="sigil-mark">✧</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link href="/plateau" className="btn-grimoire text-center">
                Rejoindre le plateau
              </Link>
              {user.role === "mj" ? (
                <Link href="/mj" className="btn-ghost text-center">
                  Tableau MJ
                </Link>
              ) : (
                <Link href="/me" className="btn-ghost text-center">
                  Ma fiche
                </Link>
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="btn-ghost w-full">
                  Quitter
                </button>
              </form>
            </div>
          </section>
        ) : (
          <section className="card-hero flex flex-col gap-6 lg:col-span-4">
            <header className="flex flex-col gap-3">
              <p className="label-grimoire">Convocation</p>
              <p className="font-display text-2xl leading-tight tracking-wide text-parchment">
                Rejoins la table.
              </p>
              <p className="text-[0.78rem] leading-relaxed text-parchment-dim">
                Identifie-toi avec ton compte Discord pour réclamer ta fiche
                et participer aux jets de session.
              </p>
            </header>

            <div className="sigil-divider !my-0">
              <span className="sigil-mark">✧</span>
            </div>

            <form
              action={async () => {
                "use server";
                await signIn("discord", { redirectTo: "/me" });
              }}
            >
              <button
                type="submit"
                className="w-full rounded-[--radius-sm] bg-[#5865F2] px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-[#4752c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-aged/40"
              >
                Connexion avec Discord
              </button>
            </form>

            <p className="text-[0.68rem] italic leading-relaxed text-parchment-mute">
              Les invitations sont accordées par le MJ. Demande l&apos;accès
              à la table avant de tenter ta première convocation.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
