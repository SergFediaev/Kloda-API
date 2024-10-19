import { Elysia, t } from 'elysia'

const categoryModel = t.Object({
  name: t.String(),
  displayName: t.String(),
  cardsCount: t.Number(),
})

export const categoriesModel = new Elysia().model({
  categories: t.Array(categoryModel),
})
