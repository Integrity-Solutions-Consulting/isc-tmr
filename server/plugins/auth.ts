import { Elysia } from "elysia";
import { isAPIError } from "better-auth/api";

import { accessTokenVerifyOptions, auth, resourceClient } from "../lib/auth";
import { missingPermissions, toPrincipal, type Principal } from "../lib/principal";

/** Qué exige una ruta: scopes (consentimiento de la app) y permisos (rol en la org). */
type AuthRequirement =
  | true
  | string[]
  | { scopes?: string[]; permissions?: string[] };

const normalize = (requirement: AuthRequirement) =>
  requirement === true
    ? { scopes: undefined, permissions: [] as string[] }
    : Array.isArray(requirement)
      ? { scopes: requirement, permissions: [] as string[] }
      : { scopes: requirement.scopes, permissions: requirement.permissions ?? [] };

const hasAuthorizationHeader = (headers: Headers) =>
  Boolean(headers.get("authorization"));

// Endpoints de Better Auth: /api/auth/sign-in/social, /api/auth/callback/:id, ...
// Va aparte del macro porque los módulos que usan el macro tienen su propio prefix
export const authRoutes = new Elysia({ name: "auth.routes" }).all(
  "/auth/*",
  ({ request }) => auth.handler(request),
  { parse: "none", detail: { hide: true } },
);

/**
 * Macro `auth` para proteger rutas con el gate.
 *
 * - `{ auth: true }`: exige usuario autenticado.
 * - `{ auth: ['todo:read'] }`: además exige esos scopes en el access token.
 * - `{ auth: { scopes: ['todo:read'], permissions: ['todo:read'] } }`: además
 *   exige esos permisos en la organización elegida (claim `permissions` del
 *   gate, scope `organization`). Sin ellos → 403 insufficient_permissions.
 *
 * Acepta `Authorization: Bearer|DPoP <token>` (clientes externos) o la cookie
 * de sesión del front; en ese caso usa el access token del gate guardado en la
 * account cookie (se refresca solo), así ambos caminos validan los mismos scopes.
 */
export const authPlugin = new Elysia({ name: "auth" }).macro({
  auth: (requirement: AuthRequirement) => ({
    detail: { security: [{ bearerAuth: [] }] },
    async resolve({ request, set, status }) {
      const { scopes, permissions } = normalize(requirement);
      const verifyOptions = {
        ...accessTokenVerifyOptions,
        requiredScopes: scopes,
      };
      const forbidden = (principal: Principal) => {
        const missing = missingPermissions(principal, permissions);
        return missing.length
          ? status(403, {
              message: principal.org
                ? `insufficient_permissions: ${missing.join(" ")}`
                : "insufficient_permissions: el token no trae organización (scope organization)",
            })
          : null;
      };

      try {
        if (hasAuthorizationHeader(request.headers)) {
          const payload = await resourceClient.verifyAccessTokenRequest(
            request,
            verifyOptions,
          );

          const principal = toPrincipal("bearer", payload);
          return forbidden(principal) ?? { principal };
        }

        const session = await auth.api.getSession({
          headers: request.headers,
        });
        if (!session) return status(401, { message: "Unauthorized" });

        const { headers, response } = await auth.api.getAccessToken({
          body: { useAccountCookie: true },
          headers: request.headers,
          returnHeaders: true,
        });

        // Si hubo refresh, la account cookie cambió y hay que devolverla
        const cookies = headers.getSetCookie();
        if (cookies.length) set.headers["set-cookie"] = cookies;

        const payload = await resourceClient.verifyBearerToken(
          response.accessToken,
          verifyOptions,
        );

        const principal = toPrincipal("session", payload);
        return forbidden(principal) ?? { principal, user: session.user };
      } catch (error) {
        if (!isAPIError(error)) throw error;

        const challenge = new Headers(error.headers).get("www-authenticate");
        if (challenge) set.headers["www-authenticate"] = challenge;

        return status(error.statusCode === 403 ? 403 : 401, {
          message: error.body?.message ?? error.message,
        });
      }
    },
  }),
});
