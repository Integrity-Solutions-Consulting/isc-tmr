import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { accessTokenVerifyOptions, auth, resourceClient } from "@/server/lib/auth";
import { ACCESS_TOKEN_HEADER, toPrincipal, type Principal } from "@/server/lib/principal";

// Data Access Layer: la verificación real de la sesión (descifra el JWE de la
// cookie). El proxy solo filtra la navegación; cada página, Server Component o
// Server Action con datos privados debe pasar por aquí. `cache` evita repetir
// el trabajo dentro de un mismo render.

/** Sesión actual o `null`. */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

/** Sesión actual; si no hay, redirige al login. */
export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/auth");
  return session;
});

/** Access token del gate: el del proxy o, si no pasó por él, el de la cuenta. */
const readAccessToken = cache(async () => {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get(ACCESS_TOKEN_HEADER);
  if (forwarded) return forwarded;
  // Sin proxy (no debería pasar en /dashboard): un refresh aquí no se puede
  // guardar en la cookie, pero el token sirve para este render.
  const { accessToken } = await auth.api.getAccessToken({
    body: { useAccountCookie: true },
    headers: requestHeaders,
  });
  return accessToken;
});

/**
 * Identidad, organización y permisos del usuario según el access token del
 * gate, verificado contra su JWKS (mismo criterio que la API). Si no hay token
 * válido (p. ej. falló el refresh) se vuelve al login con ?error: el proxy lo
 * muestra aunque haya sesión local, así no rebota de vuelta al dashboard.
 */
export const getPrincipal = cache(async (): Promise<Principal> => {
  await verifySession();
  let payload: Record<string, unknown>;
  try {
    payload = await resourceClient.verifyBearerToken(
      await readAccessToken(),
      accessTokenVerifyOptions,
    );
  } catch (error) {
    console.error("Access token del gate inválido:", error);
    redirect("/auth?error=access_token_invalid");
  }
  return toPrincipal("session", payload);
});

/** ¿Tiene el usuario este permiso en la organización elegida? (p. ej. "hr:access") */
export async function can(permission: string) {
  const { org } = await getPrincipal();
  return org?.permissions.includes(permission) ?? false;
}
