import { createEnv } from "@t3-oss/env-nextjs";

// Import relativo, no "@/env/server/schemas": next.config.ts importa este
// módulo y Next lo carga sin resolver los alias de tsconfig.
import {
  oidcEnvironment,
  redisEnvironment,
  postgreEnvironment,
  serverEnvironment,
} from "./schemas";

/**
 * Variables de entorno del servidor, validadas con zod (t3-env). Cada grupo
 * vive en ./schemas/*.schema.ts y se suma aquí con `extends`. Se migran poco a
 * poco: las que aún no están aquí (BETTER_AUTH_SECRET, BETTER_AUTH_URL) las lee
 * Better Auth directamente de process.env.
 */
export const env = createEnv({
  isServer: typeof window === "undefined",
  // `next build` no tiene las variables reales (se inyectan al ejecutar)
  skipValidation: process.env.NEXT_PHASE === "phase-production-build",
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: process.env,
  extends: [
    oidcEnvironment,
    redisEnvironment,
    postgreEnvironment,
    serverEnvironment,
  ],
});
