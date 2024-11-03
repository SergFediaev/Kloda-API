import { cards, db, decrement, dislikedCards, increment, likedCards } from 'db'
import { and, eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { idModel } from 'models'
import { authorizePlugin } from 'plugins'

export const likeRoute = new Elysia().use(authorizePlugin).patch(
  ':id/like',
  async ({ params: { id }, user, set }) => {
    if (!user) {
      set.status = 401

      console.error('User not found')

      return { message: 'Unauthorized' }
    }

    await db.transaction(async tx => {
      const userId = user.id

      const existingDislike = await tx.query.dislikedCards.findFirst({
        where: and(
          eq(dislikedCards.userId, userId),
          eq(dislikedCards.cardId, id),
        ),
      })

      if (existingDislike) {
        await tx
          .delete(dislikedCards)
          .where(
            and(eq(dislikedCards.userId, userId), eq(dislikedCards.cardId, id)),
          )

        await tx
          .update(cards)
          .set({ dislikes: decrement(cards.dislikes) })
          .where(eq(cards.id, id))
      }

      const existingLike = await tx.query.likedCards.findFirst({
        where: and(eq(likedCards.userId, userId), eq(likedCards.cardId, id)),
      })

      if (existingLike) {
        await tx
          .delete(likedCards)
          .where(and(eq(likedCards.userId, userId), eq(likedCards.cardId, id)))

        await tx
          .update(cards)
          .set({ likes: decrement(cards.likes) })
          .where(eq(cards.id, id))

        return // ToDo: Return new card status or message
      }

      await tx.insert(likedCards).values({ userId, cardId: id })

      await tx
        .update(cards)
        .set({ likes: increment(cards.likes) })
        .where(eq(cards.id, id))
    })
  },
  {
    params: idModel,
  },
)
