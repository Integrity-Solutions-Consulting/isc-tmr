import { client as redis } from'@/redis/client'
import { Result } from "@/lib/core/result";

/**
 * Interfaz para extender el error estándar de JavaScript e incluir 
 * propiedades opcionales de red o de cliente (como códigos de error).
 */
interface NetworkError extends Error {
  code?: string | number;
}

/**
 * Verifica de forma asíncrona la conectividad y disponibilidad de la instancia de Redis 
 * utilizando el cliente nativo integrado de Bun.
 * 
 * @async
 * @function pingRedisConnection
 * @returns {Promise<Result<boolean, Error>>} 
 * - Retorna un `Result.success(true)` si Redis responde exitosamente con "PONG".
 * - Retorna un `Result.failure(Error)` detallado si ocurre un fallo de conexión o excepción.
 * 
 * @example
 * const healthStatus = await pingRedisConnection();
 * if (healthStatus.isSuccess()) {
 *   console.log("Redis operativo");
 * } else {
 *   console.error("Fallo:", healthStatus.error.message);
 * }
 */
export const pingRedisConnection = async (): Promise<Result<boolean, Error>> => {
  try {
    // Tras el idleTimeout Bun cierra la conexión y no reconecta solo: con la
    // offline queue el PING esperaría para siempre. Se reconecta antes.
    if (!redis.connected) await redis.connect();

    // Envía un comando PING utilizando el cliente nativo de Bun
    const response = await redis.ping();
    
    // Valida que la respuesta del servidor sea estrictamente "PONG"
    return Result.success(response === "PONG");
  } catch (error: unknown) {
    // Validamos si la excepción capturada es una instancia de Error estándar
    if (error instanceof Error) {
      const err = error as NetworkError;

      // Si el error de Redis o de red incluye un código identificable
      if (err.code) {
        return Result.failure(new Error(`Redis Error [${err.code}]: ${err.message}`));
      }
      
      // Propagamos el mensaje de error original para una mejor depuración
      return Result.failure(new Error(err.message));
    }

    // Fallback de seguridad por si se lanza un tipo de dato no controlado (ej. string, null)
    return Result.failure(new Error("Unexpected non-error exception occurred while pinging Redis"));
  }
};