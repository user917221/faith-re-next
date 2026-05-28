import { signIn } from "@/lib/auth";

// Cette page lit `searchParams.callbackUrl` (Server Action), donc rendu dynamique requis.
export const dynamic = "force-dynamic";

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0c15] text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">FAITH : RE</h1>
        <p className="mb-8 text-sm text-white/60">
          Connecte-toi avec ton compte Discord pour rejoindre la table.
        </p>
        <form
          action={async () => {
            "use server";
            const params = await searchParams;
            await signIn("discord", { redirectTo: params.callbackUrl ?? "/me" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-[#5865F2] px-6 py-3 font-medium text-white transition hover:bg-[#4752c4]"
          >
            Connexion avec Discord
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-white/40">
          MJ ? Ton rôle est promu automatiquement si ton Discord ID correspond
          à <code className="rounded bg-white/5 px-1 py-0.5">MJ_DISCORD_ID</code>.
        </p>
      </div>
    </main>
  );
}
