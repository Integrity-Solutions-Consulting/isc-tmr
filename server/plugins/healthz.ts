import Elysia from "elysia";
import type { Result } from "@/lib/core/result";
import { healthcheckPlugin } from "elysia-healthcheck";
import { pingPostgresConnection } from "@/server/lib/pingPostgresConnection";
import { pingRedisConnection } from "@/server/lib/pingRedisConnection";
import { env } from "@/env/server";

// TODO: CONSIDERA REFACTORIZACION DEL CREATECHECKFNS

type CheckResult = {
  name: string;
  healthy: boolean;
  details?: Record<string, unknown>;
};

/**
 * Crea una función de verificación con timeout controlado mediante Promise.race,
 * utilizando los métodos nativos del patrón Result (`isFailed()`, `getValue()`, `getError()`).
 */
const createCheck = (
  name: string,
  pingFn: () => Promise<Result<boolean, Error>>,
): (() => Promise<CheckResult>) => {
  return async (): Promise<CheckResult> => {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(
        () =>
          reject(
            new Error(
              `Sin respuesta en ${env.SERVER_HEALTHZ_CHECK_TIMEOUT_MS} ms`,
            ),
          ),
        env.SERVER_HEALTHZ_CHECK_TIMEOUT_MS,
      );
    });

    try {
      // Ponemos a competir la ejecución del ping contra el temporizador
      const result = await Promise.race([pingFn(), timeoutPromise]);

      if (result.isFailed()) {
        return {
          name,
          healthy: false,
          details: { error: result.getError().message },
        };
      }

      return result.getValue()
        ? { name, healthy: true }
        : {
            name,
            healthy: false,
            details: { error: "Respuesta inesperada del servidor" },
          };
    } catch (error) {
      return {
        name,
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    } finally {
      if (timerId) clearTimeout(timerId);
    }
  };
};

export const healthzPlugin = new Elysia({ tags: ["Healthz"] }).use(
  healthcheckPlugin({
    checks: {
      liveness: [() => ({ name: "migrations", healthy: true })],
      readiness: [
        createCheck("database", pingPostgresConnection),
        createCheck("redis", pingRedisConnection),
        () => ({ name: "migrations", healthy: true }),
      ],
    },
    timeoutMs: env.SERVER_HEALTHZ_TIMEOUT_MS,
  }),
);
