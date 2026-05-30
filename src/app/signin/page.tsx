import { signIn } from "@/lib/auth";
import { ConstellationGlyph } from "@/components/glyphs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Cette page lit `searchParams.callbackUrl` (Server Action), donc rendu dynamique requis.
export const dynamic = "force-dynamic";

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <main className="relative z-[2] flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md border border-border ring-0">
        <CardContent className="flex flex-col items-center gap-7 text-center">
          {/* Glyph hero — monochrome discret (cohérent avec la landing) */}
          <ConstellationGlyph size={132} className="text-ink-tertiary" />

          <div className="flex flex-col items-center gap-2.5">
            <p className="label-grimoire">Convocation</p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              FAITH&nbsp;:&nbsp;RE
            </h1>
            <p className="max-w-xs text-sm leading-relaxed text-foreground-muted">
              Connecte-toi pour rejoindre la table.
            </p>
          </div>

          <Separator />

          {/* Form Discord — bouton brand exception */}
          <form
            className="w-full"
            action={async () => {
              "use server";
              const params = await searchParams;
              await signIn("discord", { redirectTo: params.callbackUrl ?? "/me" });
            }}
          >
            <Button
              type="submit"
              className="h-auto w-full bg-[#5865F2] py-2.5 text-white hover:bg-[#4752c4]"
            >
              Connexion avec Discord
            </Button>
          </form>

          {/* Note MJ */}
          <p className="text-xs leading-relaxed text-ink-tertiary">
            MJ&nbsp;? Ton rôle est promu automatiquement si ton Discord ID correspond à{" "}
            <code className="tabular rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-1 font-mono text-foreground-muted">
              MJ_DISCORD_ID
            </code>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
