import "server-only";

import { treaty } from "@elysia/eden";
import { headers } from "next/headers";

import { app } from "@/server";
import { ACCESS_TOKEN_HEADER } from "@/server/lib/principal";

// Cliente para Server Components / Route Handlers / Server Actions: llama a la
// app de Elysia en memoria, sin pasar por la red. `server-only` (gestionado por
// Next.js internamente) hace fallar el build si se importa desde el cliente.
//
// En memoria no viajan las cookies del navegador: se reenvían en cada llamada
// la cookie de sesión y el Authorization de la petición entrante para que el
// authPlugin autentique igual que por HTTP. Si el proxy ya obtuvo el access
// token del gate, va como Bearer: así el plugin no intenta refrescarlo (un
// `set-cookie` aquí no llegaría al navegador desde un Server Component).
export const api = treaty(app, {
  headers: async () => {
    const incoming = await headers();
    const forwarded: Record<string, string> = {};
    for (const name of ["cookie", "authorization"]) {
      const value = incoming.get(name);
      if (value) forwarded[name] = value;
    }
    const token = incoming.get(ACCESS_TOKEN_HEADER);
    if (token && !forwarded.authorization) forwarded.authorization = `Bearer ${token}`;
    return forwarded;
  },
}).api;
