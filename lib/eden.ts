import { treaty } from "@elysia/eden";

// Solo el TIPO: importar el valor `app` metería Better Auth y server/lib/env.ts
// (que exige secretos) en el bundle del navegador
import type { App } from "@/server";

// Cliente para Client Components. Usa el origen con el que el navegador llegó a
// la app (localhost, IP de la LAN, dominio...), así que no hay host fijo.
// En el render del servidor de un Client Component no existe `window`: se cae a
// BETTER_AUTH_URL. En Server Components y Route Handlers usar `@/lib/eden.server`.
const origin =
  typeof window !== "undefined"
    ? window.location.origin
    : (process.env.BETTER_AUTH_URL ?? "http://localhost:4200");

// .api para entrar al prefijo /api
export const api = treaty<App>(origin).api;
