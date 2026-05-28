/**
 * Next.js 16 — fichier `proxy.ts` (ex-`middleware.ts`, renommé en v16).
 * Runtime nodejs uniquement.
 * Redirige les requêtes non authentifiées vers /signin.
 */
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

// Config minimale (sans DB adapter) — suffisant pour vérifier la session côté proxy.
// Le full config (avec adapter Drizzle) est dans lib/auth.ts (Server Components).
const { auth } = NextAuth({
  providers: [Discord],
});

const PUBLIC_PATHS = ["/", "/signin", "/api/auth"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (isPublic) return;

  if (!req.auth) {
    const signinUrl = new URL("/signin", req.nextUrl.origin);
    signinUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(signinUrl);
  }
});

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
