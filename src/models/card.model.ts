import { Elysia, t } from 'elysia'

export const cardModel = new Elysia().model({
  cardBody: t.Object({
    title: t.String(),
    content: t.String(),
    categories: t.Array(t.String()),
    likes: t.Number(),
    dislikes: t.Number(),
    authorId: t.String(),
  }),
  cardResponse: t.Object({
    id: t.Number(),
    title: t.String(),
    content: t.String(),
    categories: t.Array(t.String()),
    likes: t.Number(),
    dislikes: t.Number(),
    authorId: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  }),
})
