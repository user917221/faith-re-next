import { signIn } from "@/lib/auth";
import { isLocalDevAuthBypass } from "@/lib/dev-mode";
import { redirect } from "next/navigation";

// Cette page lit `searchParams.callbackUrl` (Server Action), donc rendu dynamique requis.
export const dynamic = "force-dynamic";

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <main className="relative z-[2] flex min-h-screen items-center justify-center px-6">
      <div className="card-grimoire w-full max-w-md">
        <h1 className="font-display mb-2 text-3xl font-bold tracking-wide text-gold-aged">
          FAITH : RE
        </h1>
        <p className="mb-8 text-sm text-parchment-dim">
          Connecte-toi avec ton compte Discord pour rejoindre la table.
        </p>
        <form
          action={async () => {
            "use server";
            if (isLocalDevAuthBypass) redirect("/preview");
            const params = await searchParams;
            await signIn("discord", { redirectTo: params.callbackUrl ?? "/me" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-[--radius-sm] bg-[#5865F2] px-6 py-3 font-medium text-white transition hover:bg-[#4752c4]"
          >
            Connexion avec Discord
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-parchment-mute">
          MJ&nbsp;? Ton rôle est promu automatiquement si ton Discord ID correspond à{" "}
          <code className="tabular rounded-[--radius-xs] border border-gold-aged/15 bg-ink-deep px-1 py-0.5 text-gold-aged">
            MJ_DISCORD_ID
          </code>
          .
        </p>
      </div>
    </main>
  );
}
