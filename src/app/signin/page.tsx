import { signIn } from "@/lib/auth";
import { ConstellationGlyph } from "@/components/glyphs";
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
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-7 text-center">
          {/* Glyph hero — seul usage lavande décoratif autorisé, subtil */}
          <ConstellationGlyph size={132} className="text-primary/70" />

          <div className="flex flex-col items-center gap-2.5">
            <p className="label-grimoire">Convocation</p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              FAITH&nbsp;:&nbsp;RE
            </h1>
            <p className="max-w-xs text-sm text-muted-foreground">
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
            <button
              type="submit"
              className="w-full rounded-md bg-[#5865F2] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Connexion avec Discord
            </button>
          </form>

          {/* Note MJ */}
          <p className="text-xs leading-relaxed text-ink-tertiary">
            MJ&nbsp;? Ton rôle est promu automatiquement si ton Discord ID correspond à{" "}
            <code className="tabular rounded-sm border border-border bg-popover px-1 py-0.5 text-muted-foreground">
              MJ_DISCORD_ID
            </code>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
