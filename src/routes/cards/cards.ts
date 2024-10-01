import { cards, db } from 'db'
import { asc, count, eq, ilike, or } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { cardsModels, idModel } from 'models'
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
    ({ query: { search, page, limit } }) =>
      db.transaction(async tx => {
        const foundCards = await tx.query.cards.findMany({
          limit,
          offset: (page - 1) * limit,
          orderBy: asc(cards.id),
          where: search
            ? or(
                ilike(cards.title, `%${search}%`),
                ilike(cards.content, `%${search}%`),
              )
            : undefined,
        })

        const [{ total }] = await tx.select({ total: count() }).from(cards)

        return {
          cards: foundCards,
          total,
        }
      }),
    {
      response: 'cards',
      query: t.Object({
        search: t.String({ default: '' }),
        page: t.Numeric({ default: 1 }),
        limit: t.Numeric({ default: 10 }),
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
