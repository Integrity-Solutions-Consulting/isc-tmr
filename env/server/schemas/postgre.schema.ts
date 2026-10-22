import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const postgreEnvironment = createEnv({
  server: {
    DATABASE_URL: z.string(),
  },
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: process.env.NEXT_PHASE === "phase-production-build",
  isServer: typeof window === "undefined",
});
