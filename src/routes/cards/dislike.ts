import { cards, db, increment } from 'db'
import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { idModel } from 'models'

export const dislikeRoute = new Elysia().patch(
  ':id/dislike',
  ({ params: { id } }) =>
    db
      .update(cards)
      .set({ dislikes: increment(cards.dislikes) })
      .where(eq(cards.id, id)),
  {
    params: idModel,
  },
)
