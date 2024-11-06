import { cards, cardsToCategories, categories, db } from 'db'
import { eq, sql } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { categoriesModel } from 'models'

export const categoriesRoute = new Elysia({
  prefix: 'v1/categories',
})
  .use(categoriesModel)
  .get(
    '',
    () =>
      db
        .select({
          name: categories.name,
          displayName: categories.displayName,
          cardsCount: sql<number>`COUNT(cards.id)::INT`,
        })
        .from(categories)
        .leftJoin(
          cardsToCategories,
          eq(categories.id, cardsToCategories.categoryId),
        )
        .leftJoin(cards, eq(cardsToCategories.cardId, cards.id))
        .groupBy(categories.id),
    { response: 'categories' },
  )
