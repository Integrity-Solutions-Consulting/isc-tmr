import { Elysia } from "elysia";

import { authPlugin } from "../../plugins/auth";
import { TodoModel } from "./model";
import { Todo } from "./service";

// scope = la app tiene consentimiento del usuario; permiso = su rol en la
// organización elegida (gate: lib/permissions.ts, recurso `todo`).
const read = { scopes: ["todo:read"], permissions: ["todo:read"] };
const create = { scopes: ["todo:write"], permissions: ["todo:create"] };
const update = { scopes: ["todo:write"], permissions: ["todo:update"] };
const remove = { scopes: ["todo:write"], permissions: ["todo:delete"] };

export const todo = new Elysia({ prefix: "/todos", tags: ["Todo"] })
  .use(authPlugin)
  .model(TodoModel)
  .prefix("model", "Todo.")
  .get("/", () => Todo.list(), {
    auth: read,
    response: { 200: "Todo.Todos" },
    detail: { summary: "Listar tareas" },
  })
  .get("/:id", ({ params: { id } }) => Todo.get(id), {
    auth: read,
    params: "Todo.Params",
    response: { 200: "Todo.Todo", 404: "Todo.NotFound" },
    detail: { summary: "Obtener una tarea" },
  })
  .post("/", ({ body, status }) => status(201, Todo.create(body)), {
    auth: create,
    body: "Todo.Create",
    response: { 201: "Todo.Todo" },
    detail: { summary: "Crear una tarea" },
  })
  .put("/:id", ({ params: { id }, body }) => Todo.update(id, body), {
    auth: update,
    params: "Todo.Params",
    body: "Todo.Replace",
    response: { 200: "Todo.Todo", 404: "Todo.NotFound" },
    detail: { summary: "Reemplazar una tarea" },
  })
  .patch("/:id", ({ params: { id }, body }) => Todo.update(id, body), {
    auth: update,
    params: "Todo.Params",
    body: "Todo.Patch",
    response: { 200: "Todo.Todo", 404: "Todo.NotFound" },
    detail: { summary: "Actualizar parcialmente una tarea" },
  })
  .delete("/:id", ({ params: { id } }) => Todo.remove(id), {
    auth: remove,
    params: "Todo.Params",
    response: { 200: "Todo.Todo", 404: "Todo.NotFound" },
    detail: { summary: "Eliminar una tarea" },
  });
