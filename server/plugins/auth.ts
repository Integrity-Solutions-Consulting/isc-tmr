import { Elysia } from "elysia";
import { isAPIError } from "better-auth/api";

import { accessTokenVerifyOptions, auth, resourceClient } from "../lib/auth";

/** Rol y permisos del usuario en la organización elegida al iniciar sesión. */
type Organization = { id: string; role: string; permissions: string[] };

type Principal = {
  via: "session" | "bearer";
  sub: string;
  scopes: string[];
  /** Solo si la app pidió el scope `organization` y el gate emitió los claims. */
  org: Organization | null;
  claims: Record<string, unknown>;
};

/** Qué exige una ruta: scopes (consentimiento de la app) y permisos (rol en la org). */
type AuthRequirement =
  | true
  | string[]
  | { scopes?: string[]; permissions?: string[] };

const toScopes = (scope: unknown) =>
  typeof scope === "string" ? scope.split(" ").filter(Boolean) : [];

const normalize = (requirement: AuthRequirement) =>
  requirement === true
    ? { scopes: undefined, permissions: [] as string[] }
    : Array.isArray(requirement)
      ? { scopes: requirement, permissions: [] as string[] }
      : { scopes: requirement.scopes, permissions: requirement.permissions ?? [] };

// Claims que añade el gate con el scope `organization`
// (org_id, org_role, permissions: ["todo:read", ...]).
const toOrganization = (claims: Record<string, unknown>): Organization | null =>
  typeof claims.org_id === "string"
    ? {
        id: claims.org_id,
        role: typeof claims.org_role === "string" ? claims.org_role : "",
        permissions: Array.isArray(claims.permissions)
          ? claims.permissions.filter((p): p is string => typeof p === "string")
          : [],
      }
    : null;

const toPrincipal = (
  via: Principal["via"],
  payload: Record<string, unknown>,
): Principal => ({
  via,
  sub: String(payload.sub),
  scopes: toScopes(payload.scope),
  org: toOrganization(payload),
  claims: payload,
});

const missingPermissions = (principal: Principal, required: string[]) =>
  required.filter((p) => !principal.org?.permissions.includes(p));

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
