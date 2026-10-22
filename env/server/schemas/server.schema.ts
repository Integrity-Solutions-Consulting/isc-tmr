import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const serverEnvironment = createEnv({
  server: {
    SERVER_HEALTHZ_TIMEOUT_MS: z.coerce.number().default(5000),
    SERVER_HEALTHZ_CHECK_TIMEOUT_MS: z.coerce.number().default(3000),
  },
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: process.env.NEXT_PHASE === "phase-production-build",
  isServer: typeof window === "undefined",
});
