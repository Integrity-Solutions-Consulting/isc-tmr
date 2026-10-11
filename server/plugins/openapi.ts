import { openapi } from "@elysia/openapi";

// Docs UI en /api/openapi y spec en /api/openapi/json (relativo al prefix de la app)
export const openapiPlugin = openapi({
  documentation: {
    info: {
      title: "ISC TMR API",
      version: "1.0.0",
      description:
        "API construida con Elysia sobre Next.js. Las rutas protegidas aceptan la cookie de sesión (login en /auth) o un access token JWT del ISC Auth Gate.",
    },
    tags: [
      { name: "App", description: "Endpoints generales" },
      { name: "Todo", description: "Módulo de ejemplo de tareas" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Access token emitido por el ISC Auth Gate con resource = esta API",
        },
      },
    },
  },
});
