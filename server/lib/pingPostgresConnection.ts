import { sql, SQL } from "bun";
import { Result } from "@/lib/core/result";

/**
 * Verifica de forma asíncrona la conectividad y disponibilidad de la instancia de PostgreSQL 
 * utilizando el manejo oficial de errores de Bun (`SQL.PostgresError`).
 * 
 * @async
 * @function pingPostgresConnection
 * @returns {Promise<Result<boolean, Error>>} 
 * - Retorna un `Result.success(true)` si la consulta de prueba `SELECT 1` se ejecuta con éxito.
 * - Retorna un `Result.failure(Error)` detallado si ocurre un fallo de conexión o error SQL específico.
 */
export const pingPostgresConnection = async (): Promise<Result<boolean, Error>> => {
  try {
    // Ejecuta la consulta de salud usando Bun.sql
    const result = await sql`SELECT 1 as ping`;
    
    // Valida que el resultado no esté vacío
    return Result.success(Array.isArray(result) && result.length > 0);
  } catch (error: unknown) {
    // Capturamos errores específicos de PostgreSQL usando la clase nativa de Bun
    if (error instanceof SQL.PostgresError) {
      return Result.failure(
        new Error(`PostgreSQL Error [Code: ${error.code}]: ${error.message}${error.detail ? ` - Detail: ${error.detail}` : ''}`)
      );
    }
    
    // Si ocurre cualquier otro error genérico de SQL o de red
    if (error instanceof SQL.SQLError) {
      return Result.failure(new Error(`SQL Error: ${error.message}`));
    }

    // Fallback estándar por si se lanza un error no relacionado con la base de datos
    if (error instanceof Error) {
      return Result.failure(new Error(error.message));
    }

    return Result.failure(new Error("Unexpected non-error exception occurred while pinging PostgreSQL"));
  }
};