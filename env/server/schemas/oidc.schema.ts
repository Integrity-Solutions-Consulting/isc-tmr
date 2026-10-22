import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const withoutTrailingSlash = (url: string) => url.replace(/\/+$/, "");

/** Cliente OIDC del ISC Auth Gate (genericOAuth + verificación de access tokens). */
export const oidcEnvironment = createEnv({
  server: {
    /** Issuer del gate (Better Auth oauth-provider), incluye su basePath. */
    OIDC_ISSUER: z
      .url()
      .default("http://localhost:3000/api/auth")
      .transform(withoutTrailingSlash),
    OIDC_CLIENT_ID: z.string().min(1),
    OIDC_CLIENT_SECRET: z.string().min(1),
    /** Identifier del Resource registrado en el gate; viaja como `aud` del access token. */
    OIDC_RESOURCE: z
      .url()
      .default("http://localhost:4200/api")
      .transform(withoutTrailingSlash),
  },
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: process.env.NEXT_PHASE === "phase-production-build",
  isServer: typeof window === "undefined",
});
