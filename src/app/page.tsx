import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";
import { ConstellationGlyph } from "@/components/glyphs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsOf, avatarFallbackStyle } from "@/lib/avatar";

// Lit la session côté serveur — rendu dynamique.
export const dynamic = "force-dynamic";

// Libellés de rôle — alignés sur la sidebar du shell.
const ROLE_LABEL: Record<"mj" | "player" | "spectator", string> = {
  mj: "Meneur de jeu",
  player: "Joueur",
  spectator: "Spectateur",
};

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="relative z-[2] min-h-screen px-6 py-10 md:py-16">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-5 lg:items-stretch">
        {/* ============================================================
            HERO — col-span-3 : glyph lavande discret + titre Linear
            ============================================================ */}
        <Card className="justify-center border border-border ring-0 lg:col-span-3">
          <CardContent className="flex min-h-[440px] flex-col items-center justify-center gap-8 text-center lg:min-h-[520px]">
            {/* Glyph hero — monochrome discret (lavande réservée au CTA) */}
            <ConstellationGlyph size={160} className="text-ink-tertiary" />

            <div className="flex flex-col items-center gap-3">
              <p className="label-grimoire">Grimoire de campagne</p>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                FAITH&nbsp;:&nbsp;RE
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-foreground-muted">
                Compagnon de jeu &amp; fiches de personnage.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================
            AUTH — col-span-2 : convocation ou identité
            ============================================================ */}
        {user ? (
          <Card className="border border-border ring-0 lg:col-span-2">
            <CardContent className="flex h-full flex-col gap-5">
              <header className="flex flex-col gap-3">
                <p className="label-grimoire">Compagnon</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-md">
                    {user.image && (
                      <AvatarImage src={user.image} alt={user.name ?? ""} />
                    )}
                    <AvatarFallback
                      className="rounded-md text-sm"
                      style={avatarFallbackStyle(user.name ?? "")}
                    >
                      {initialsOf(user.name ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="truncate text-lg font-medium leading-tight tracking-tight text-foreground">
                      {user.name}
                    </p>
                    <Badge
                      variant="outline"
                      className="w-fit uppercase tracking-wider"
                    >
                      {ROLE_LABEL[user.role]}
                    </Badge>
                  </div>
                </div>
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
          <Card className="border border-border ring-0 lg:col-span-2">
            <CardContent className="flex h-full flex-col gap-5">
              <header className="flex flex-col gap-3">
                <p className="label-grimoire">Convocation</p>
                <p className="text-2xl font-medium leading-tight tracking-tight text-foreground">
                  Rejoins la table.
                </p>
                <p className="text-sm leading-relaxed text-foreground-muted">
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
                <Button
                  type="submit"
                  className="h-auto w-full bg-[#5865F2] py-2.5 text-white hover:bg-[#4752c4]"
                >
                  Connexion avec Discord
                </Button>
              </form>

              <p className="text-xs leading-relaxed text-ink-tertiary">
                Les invitations sont accordées par le MJ. Demande l&apos;accès
                à la table avant de tenter ta première convocation. Ton rôle
                est promu MJ si ton Discord ID correspond à{" "}
                <code className="tabular rounded-md border border-border bg-background/45 px-2 py-1 font-mono text-foreground-muted">
                  MJ_DISCORD_ID
                </code>
                .
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
