import { cards, db } from 'db'
import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { cardsModels, idModel } from 'models'
import { dislikeRoute } from './dislike'
import { likeRoute } from './like'

export const cardsRoute = new Elysia({
  prefix: 'v1/cards',
})
  .use(cardsModels)
  .use(likeRoute)
  .use(dislikeRoute)
  .get('', () => db.select().from(cards), {
    response: 'cards',
  })
  .get(
    ':id',
    ({ params: { id } }) => db.select().from(cards).where(eq(cards.id, id)),
    {
      params: idModel,
      response: 'cards',
    },
  )
  .post('', ({ body }) => db.insert(cards).values(body).returning(), {
    body: 'card',
    response: 'cards',
  })
