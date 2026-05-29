import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";
import { ConstellationGlyph } from "@/components/glyphs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Lit la session côté serveur — rendu dynamique.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="relative z-[2] min-h-screen px-6 py-10 md:py-16">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-5 lg:items-stretch">
        {/* ============================================================
            HERO — col-span-3 : glyph lavande discret + titre Linear
            ============================================================ */}
        <Card className="justify-center lg:col-span-3">
          <CardContent className="flex min-h-[440px] flex-col items-center justify-center gap-8 text-center lg:min-h-[520px]">
            {/* Glyph hero — seul usage lavande décoratif autorisé, subtil */}
            <ConstellationGlyph size={176} className="text-primary/70" />

            <div className="flex flex-col items-center gap-3">
              <p className="label-grimoire">Grimoire de campagne</p>
              <h1 className="text-6xl font-semibold tracking-tight text-foreground">
                FAITH&nbsp;:&nbsp;RE
              </h1>
              <p className="max-w-md text-sm text-muted-foreground">
                Compagnon de jeu &amp; fiches de personnage.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================
            AUTH — col-span-2 : convocation ou identité
            ============================================================ */}
        {user ? (
          <Card className="lg:col-span-2">
            <CardContent className="flex h-full flex-col gap-5">
              <header className="flex flex-col gap-3">
                <p className="label-grimoire">Compagnon</p>
                <p className="text-2xl font-medium tracking-tight text-foreground">
                  {user.name}
                </p>
                <Badge variant="outline" className="w-fit uppercase tracking-[0.12em]">
                  Rôle&nbsp;: {user.role}
                </Badge>
              </header>

              <Separator />

              <div className="mt-auto flex flex-col gap-2.5">
                <Button asChild className="w-full">
                  <Link href="/plateau">Rejoindre le plateau</Link>
                </Button>
                {user.role === "mj" ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/mj">Tableau MJ</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/me">Ma fiche</Link>
                  </Button>
                )}
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <Button type="submit" variant="ghost" className="w-full">
                    Quitter
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-2">
            <CardContent className="flex h-full flex-col gap-5">
              <header className="flex flex-col gap-3">
                <p className="label-grimoire">Convocation</p>
                <p className="text-2xl font-medium leading-tight tracking-tight text-foreground">
                  Rejoins la table.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Identifie-toi avec ton compte Discord pour réclamer ta fiche
                  et participer aux jets de session.
                </p>
              </header>

              <Separator />

              <form
                className="mt-auto"
                action={async () => {
                  "use server";
                  await signIn("discord", { redirectTo: "/me" });
                }}
              >
                <button
                  type="submit"
                  className="w-full rounded-md bg-[#5865F2] px-6 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[#4752c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Connexion avec Discord
                </button>
              </form>

              <p className="text-xs leading-relaxed text-ink-tertiary">
                Les invitations sont accordées par le MJ. Demande l&apos;accès
                à la table avant de tenter ta première convocation.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
