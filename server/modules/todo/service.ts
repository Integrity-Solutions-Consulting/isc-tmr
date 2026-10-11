import { status } from "elysia";

import type { TodoModel } from "./model";

// Almacenamiento en memoria solo para el ejemplo; se reinicia con cada recarga del servidor
const store = new Map<string, TodoModel["todo"]>();

const notFound = () =>
  status(404, { message: "Todo not found" } satisfies TodoModel["notFound"]);

export abstract class Todo {
  static list(): TodoModel["todos"] {
    return [...store.values()];
  }

  static get(id: string) {
    return store.get(id) ?? notFound();
  }

  static create({ title, completed = false }: TodoModel["create"]) {
    const now = new Date().toISOString();
    const todo: TodoModel["todo"] = {
      id: crypto.randomUUID(),
      title,
      completed,
      createdAt: now,
      updatedAt: now,
    };

    store.set(todo.id, todo);

    return todo;
  }

  static update(id: string, data: TodoModel["replace"] | TodoModel["patch"]) {
    const current = store.get(id);
    if (!current) return notFound();

    const todo: TodoModel["todo"] = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    store.set(id, todo);

    return todo;
  }

  static remove(id: string) {
    const todo = store.get(id);
    if (!todo) return notFound();

    store.delete(id);

    return todo;
  }
}
