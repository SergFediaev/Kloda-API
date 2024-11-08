import { cards, db, getCards } from 'db'
import { and, ne, sql } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { cardModel, cardsModels, encodedCategoriesModel } from 'models'
import { authenticatePlugin } from 'plugins'
import { getCategoriesFilter } from 'utils'

export const randomRoute = new Elysia()
  .use(cardsModels)
  .use(authenticatePlugin)
  .get(
    'random',
    async ({ query: { currentCardId, categories }, user }) => {
      const categoriesFilter = getCategoriesFilter(categories)
      const notCurrentCard = ne(cards.id, currentCardId)

      const [card] = await getCards(db, user?.id)
        .orderBy(sql`RANDOM()`)
        .where(
          categoriesFilter
            ? and(categoriesFilter, notCurrentCard)
            : notCurrentCard,
        )
        .limit(1)

      return card
    },
    {
      query: t.Object({
        currentCardId: t.Numeric(),
        categories: encodedCategoriesModel,
      }),
      response: cardModel,
    },
  )
