import { app } from "@/server";

// Next.js solo permite exportar handlers HTTP desde route.ts; la app vive en /server
export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
export const HEAD = app.fetch;
// OPTIONS lo responde Next.js automáticamente; exportarlo cuando se agregue CORS
