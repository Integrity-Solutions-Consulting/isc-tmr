import { t } from "elysia";

const todo = t.Object({
  id: t.String({ format: "uuid" }),
  title: t.String(),
  completed: t.Boolean(),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

const title = t.String({ minLength: 1, maxLength: 200 });

export const TodoModel = {
  todo,
  todos: t.Array(todo),
  create: t.Object({
    title,
    completed: t.Optional(t.Boolean()),
  }),
  // PUT: reemplazo completo
  replace: t.Object({
    title,
    completed: t.Boolean(),
  }),
  // PATCH: actualización parcial
  patch: t.Partial(
    t.Object({
      title,
      completed: t.Boolean(),
    }),
  ),
  params: t.Object({
    id: t.String({ format: "uuid" }),
  }),
  notFound: t.Object({
    message: t.Literal("Todo not found"),
  }),
} as const;

export type TodoModel = {
  [K in keyof typeof TodoModel]: (typeof TodoModel)[K]["static"];
};
