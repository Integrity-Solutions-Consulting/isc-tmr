import { RedisClient } from "bun";
import { redisEnvironment } from "@/env/server/schemas/redis.schema";

// La URL decide el TLS: redis:// sin cifrar, rediss:// con TLS
export const client = new RedisClient(redisEnvironment.REDIS_URL, {
  // Connection timeout in milliseconds (default: 10000)
  connectionTimeout: 5000,

  // Idle timeout in milliseconds (default: 0 = no timeout). Bun counts it
  // from the last data the server sent. Sending does not reset it. When it
  // fires, Bun closes the connection and runs onclose. Bun does not reconnect
  // on its own, even with autoReconnect: true. Call connect() to reconnect.
  idleTimeout: 30000,

  // Whether to automatically reconnect on disconnection (default: true)
  autoReconnect: true,

  // Maximum number of reconnection attempts (default: 20)
  maxRetries: 10,

  // Whether to queue commands when disconnected (default: true)
  enableOfflineQueue: true,

  // Whether to automatically pipeline commands (default: true)
  enableAutoPipelining: true,

  // TLS options (default: false). Con rediss:// en REDIS_URL no hace falta;
  // `tls: true` contra un servidor sin TLS (redis://) deja la conexión colgada.
  // Para una config TLS propia:
  // tls: {
  //   rejectUnauthorized: true,
  //   ca: "path/to/ca.pem",
  //   cert: "path/to/cert.pem",
  //   key: "path/to/key.pem",
  //   serverName: "redis.example.com", // SNI and the name the certificate must match (default: the URL host)
  // }
});
