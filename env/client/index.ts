import { createEnv } from "@t3-oss/env-nextjs";

/**
 * Variables públicas (NEXT_PUBLIC_*) para el navegador. Aún no hay ninguna.
 *
 * `runtimeEnv` explícito, no `process.env`: Next solo inyecta en el bundle del
 * navegador las NEXT_PUBLIC_* escritas literalmente, p. ej.
 *   client: { NEXT_PUBLIC_X: z.url() },
 *   runtimeEnv: { NEXT_PUBLIC_X: process.env.NEXT_PUBLIC_X },
 */
export const env = createEnv({
  client: {},
  runtimeEnv: {},
  emptyStringAsUndefined: true,
  skipValidation: process.env.NEXT_PHASE === "phase-production-build",
});
