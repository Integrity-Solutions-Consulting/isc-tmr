import { betterAuth } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { oauthProviderResourceClient } from "@better-auth/oauth-provider/resource-client";

import { env } from "@/env/server";

export const GATE_PROVIDER_ID = "isc-gate";

const issuer = env.OIDC_ISSUER;

// Sin `database` Better Auth corre en modo stateless: la sesión (JWE) y los
// tokens del gate (account cookie) viven en cookies cifradas.
// BETTER_AUTH_SECRET y BETTER_AUTH_URL se leen del entorno.
export const auth = betterAuth({
  appName: "ISC TMR",
  // Errores del callback OAuth sin errorCallbackURL recuperable (p. ej. state
  // perdido o caducado): a nuestro login en vez de la página /api/auth/error
  onAPIError: { errorURL: "/auth" },
  advanced: {
    // En localhost las cookies no se aíslan por puerto: sin prefijo propio
    // pisaríamos las cookies `better-auth.*` del gate
    cookiePrefix: "isc-tmr",
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: GATE_PROVIDER_ID,
          name: "ISC Auth Gate",
          discoveryUrl: `${issuer}/.well-known/openid-configuration`,
          // Respaldo por si el gate no responde cuando arranca el servidor:
          // el discovery se hace una sola vez al iniciar
          accountIssuer: issuer,
          authorizationUrl: `${issuer}/oauth2/authorize`,
          tokenUrl: `${issuer}/oauth2/token`,
          userInfoUrl: `${issuer}/oauth2/userinfo`,
          endSessionEndpoint: `${issuer}/oauth2/end-session`,
          clientId: env.OIDC_CLIENT_ID,
          clientSecret: env.OIDC_CLIENT_SECRET,
          // Debe coincidir con el token_endpoint_auth_method del cliente en el
          // gate (client_secret_basic); el default de Better Auth es _post y el
          // gate rechaza el canje del code si no coincide
          authentication: "basic",
          scopes: [
            "openid",
            "profile",
            "email",
            "offline_access",
            "todo:read",
            "todo:write",
            // Rol y permisos en la organización elegida al entrar (claims
            // org_id / org_role / permissions en el access token)
            "organization",
          ],
          // RFC 8707: con `resource` el gate emite access tokens JWT con aud = API
          authorizationUrlParams: { resource: env.OIDC_RESOURCE },
          refreshTokenParams: { resource: env.OIDC_RESOURCE },
          postLogoutRedirectURI: "/",
        },
      ],
    }),
  ],
});

// Verifica access tokens del gate localmente contra su JWKS
export const resourceClient = createAuthClient({
  plugins: [oauthProviderResourceClient()],
});

export const accessTokenVerifyOptions = {
  jwksUrl: `${issuer}/jwks`,
  verifyOptions: {
    issuer,
    audience: env.OIDC_RESOURCE,
  },
};
