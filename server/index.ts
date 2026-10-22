import { Elysia } from "elysia";

import { todo } from "./modules/todo";
import { authPlugin, authRoutes } from "./plugins/auth";
import { openapiPlugin } from "./plugins/openapi";
import { healthzPlugin } from "./plugins/healthz";

export const app = new Elysia({ prefix: "/api" })
  .use(healthzPlugin)
  .use(openapiPlugin)
  .use(authRoutes)
  .use(authPlugin)
  .get("/", "Hello Nextjs", {
    detail: { summary: "Health check", tags: ["App"] },
  })
  .get("/me", ({ principal }) => principal, {
    auth: true,
    detail: { summary: "Identidad y scopes del token actual", tags: ["App"] },
  })
  .use(todo);

export type App = typeof app;
