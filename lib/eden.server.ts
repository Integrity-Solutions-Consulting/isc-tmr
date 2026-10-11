import "server-only";

import { treaty } from "@elysia/eden";

import { app } from "@/server";

// Cliente para Server Components / Route Handlers / Server Actions: llama a la
// app de Elysia en memoria, sin pasar por la red. `server-only` (gestionado por
// Next.js internamente) hace fallar el build si se importa desde el cliente.
export const api = treaty(app).api;
