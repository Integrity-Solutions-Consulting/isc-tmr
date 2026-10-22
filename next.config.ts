import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Valida las variables de entorno al arrancar (t3-env): un .env mal
// configurado falla aquí y no en la primera petición. En `next build` se omite.
import "./env/server";
import "./env/client";

// Usa i18n/request.ts (ruta por defecto del plugin)
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  allowedDevOrigins: ["192.168.100.227", "192.168.101.42", "192.168.103.6", "192.168.101.14"],
  async headers() {
    return [
      {
        // El SW debe revalidarse siempre para que las actualizaciones lleguen.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
