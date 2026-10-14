// Identidad y permisos a partir del access token del gate. Lo comparten la API
// (server/plugins/auth.ts) y las páginas (lib/dal.ts) para decidir igual.

/**
 * Cabecera interna con el access token del gate: la pone el proxy (que puede
 * refrescarlo y guardar la cookie) para que las páginas no lo refresquen. No se
 * confía en ella: quien la lee verifica la firma contra el JWKS del gate.
 */
export const ACCESS_TOKEN_HEADER = "x-isc-access-token";

/** Rol y permisos del usuario en la organización elegida al iniciar sesión. */
export type Organization = { id: string; role: string; permissions: string[] };

export type Principal = {
  via: "session" | "bearer";
  sub: string;
  scopes: string[];
  /** Solo si la app pidió el scope `organization` y el gate emitió los claims. */
  org: Organization | null;
  claims: Record<string, unknown>;
};

export const toScopes = (scope: unknown) =>
  typeof scope === "string" ? scope.split(" ").filter(Boolean) : [];

// Claims que añade el gate con el scope `organization`
// (org_id, org_role, permissions: ["todo:read", ...]).
export const toOrganization = (
  claims: Record<string, unknown>,
): Organization | null =>
  typeof claims.org_id === "string"
    ? {
        id: claims.org_id,
        role: typeof claims.org_role === "string" ? claims.org_role : "",
        permissions: Array.isArray(claims.permissions)
          ? claims.permissions.filter((p): p is string => typeof p === "string")
          : [],
      }
    : null;

export const toPrincipal = (
  via: Principal["via"],
  payload: Record<string, unknown>,
): Principal => ({
  via,
  sub: String(payload.sub),
  scopes: toScopes(payload.scope),
  org: toOrganization(payload),
  claims: payload,
});

export const missingPermissions = (principal: Principal, required: string[]) =>
  required.filter((p) => !principal.org?.permissions.includes(p));
