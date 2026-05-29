import { signIn } from "@/lib/auth";
import { ConstellationGlyph } from "@/components/glyphs";

// Cette page lit `searchParams.callbackUrl` (Server Action), donc rendu dynamique requis.
export const dynamic = "force-dynamic";

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <main className="relative z-[2] flex min-h-screen items-center justify-center px-6 py-12">
      <section className="card-hero w-full max-w-md">
        <div className="flex flex-col items-center gap-7 text-center">
          {/* Glyph hero dominant — rotation très lente + sigil-glow pulse */}
          <div className="text-gold-aged glyph-rotate">
            <div className="sigil-glow">
              <ConstellationGlyph size={150} />
            </div>
          </div>

          {/* Convocation + titre rituel */}
          <div className="flex flex-col items-center gap-3">
            <p className="label-grimoire">Convocation</p>
            <h1 className="font-display text-4xl font-bold tracking-[0.04em] text-gold-aged drop-shadow-[0_0_24px_rgba(202,161,90,0.18)]">
              FAITH&nbsp;:&nbsp;RE
            </h1>
            <p className="font-display max-w-xs text-[0.7rem] uppercase tracking-[0.22em] text-parchment-dim">
              Connecte-toi pour rejoindre la table
            </p>
          </div>

          {/* Sigil divider */}
          <div className="sigil-divider !my-0 w-full">
            <span className="sigil-mark">✦</span>
          </div>

          {/* Form Discord — bouton brand exception */}
          <form
            className="w-full"
            action={async () => {
              "use server";
              const params = await searchParams;
              await signIn("discord", { redirectTo: params.callbackUrl ?? "/me" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-[--radius-sm] bg-[#5865F2] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#4752c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-aged/40"
            >
              Connexion avec Discord
            </button>
          </form>

          {/* Note MJ */}
          <p className="text-[0.66rem] leading-relaxed text-parchment-mute">
            MJ&nbsp;? Ton rôle est promu automatiquement si ton Discord ID correspond à{" "}
            <code className="tabular rounded-[--radius-xs] border border-gold-aged/20 bg-ink-deep px-1 py-0.5 text-gold-aged">
              MJ_DISCORD_ID
            </code>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
