import { cards, db, increment } from 'db'
import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { idModel } from 'models'

export const likeRoute = new Elysia().patch(
  ':id/like',
  ({ params: { id } }) =>
    db
      .update(cards)
      .set({ likes: increment(cards.likes) })
      .where(eq(cards.id, id)),
  {
    params: idModel,
  },
)
