import { cards, db } from 'db'
import { asc, count, desc, eq, ilike, or } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { cardModel, cardsModels, idModel } from 'models'
import { dislikeRoute } from './dislike'
import { likeRoute } from './like'

export const cardsRoute = new Elysia({
  prefix: 'v1/cards',
})
  .use(cardsModels)
  .use(likeRoute)
  .use(dislikeRoute)
  .get(
    '',
    ({ query: { search, page, limit, order, sort } }) =>
      db.transaction(async tx => {
        const orderBy = order === 'asc' ? asc : desc
        const decodedSearch = decodeURIComponent(search)

        const foundCards = await tx.query.cards.findMany({
          limit,
          offset: (page - 1) * limit,
          orderBy: orderBy(cards[sort]),
          where: decodedSearch
            ? or(
                ilike(cards.title, `%${decodedSearch}%`),
                ilike(cards.content, `%${decodedSearch}%`),
              )
            : undefined,
        })

        const [{ totalCards }] = await tx
          .select({ totalCards: count() })
          .from(cards)

        const totalPages = Math.ceil(totalCards / limit)

        return {
          cards: foundCards,
          totalCards,
          totalPages,
        }
      }),
    {
      response: 'cards',
      query: t.Object({
        search: t.String({ default: '' }),
        page: t.Numeric({ default: 1 }),
        limit: t.Numeric({ default: 10 }),
        order: t.Union([t.Literal('asc'), t.Literal('desc')], {
          default: 'desc',
        }),
        sort: t.KeyOf(cardModel, { default: 'createdAt' }),
      }), // ToDo: Refactor query model
    },
  )
  .get(
    ':id',
    async ({ params: { id } }) => {
      const card = await db.query.cards.findFirst({
        where: eq(cards.id, id),
      })

      if (card) {
        return [card]
      }

      return []
    },
    {
      params: idModel,
      response: 'card',
    },
  )
  .post('', ({ body }) => db.insert(cards).values(body).returning(), {
    body: 'create',
    response: 'card',
  })
