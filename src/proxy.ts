/**
 * Next.js 16 — fichier `proxy.ts` (ex-`middleware.ts`, renommé en v16).
 * Runtime nodejs uniquement.
 *
 * Réutilise le `auth` complet de `lib/auth.ts` (avec Drizzle adapter +
 * session strategy database) pour éviter les erreurs JWTSession quand
 * le cookie pointe vers une row session en BDD et non un JWT.
 *
 * Redirige vers /signin si la session est manquante.
 */
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/signin", "/api/auth", "/preview", "/v0"];

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
