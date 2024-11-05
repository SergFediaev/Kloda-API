import { cards, db, decrement, dislikedCards, increment, likedCards } from 'db'
import { and, eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { cardsModels, idModel } from 'models'
import { authorizePlugin } from 'plugins'

export const dislikeRoute = new Elysia()
  .use(cardsModels)
  .use(authorizePlugin)
  .patch(
    ':id/dislike',
    async ({ params: { id }, user, set }) => {
      if (!user) {
        set.status = 401

        console.error('User not found')

        return { message: 'Unauthorized' }
      }

      return db.transaction(async tx => {
        const userId = user.id

        const existingLike = await tx.query.likedCards.findFirst({
          where: and(eq(likedCards.userId, userId), eq(likedCards.cardId, id)),
        })

        if (existingLike) {
          await tx
            .delete(likedCards)
            .where(
              and(eq(likedCards.userId, userId), eq(likedCards.cardId, id)),
            )

          await tx
            .update(cards)
            .set({ likes: decrement(cards.likes) })
            .where(eq(cards.id, id))
        }

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
              and(
                eq(dislikedCards.userId, userId),
                eq(dislikedCards.cardId, id),
              ),
            )

          await tx
            .update(cards)
            .set({ dislikes: decrement(cards.dislikes) })
            .where(eq(cards.id, id))

          return { isDisliked: false }
        }

        await tx.insert(dislikedCards).values({ userId, cardId: id })

        await tx
          .update(cards)
          .set({ dislikes: increment(cards.dislikes) })
          .where(eq(cards.id, id))

        return { isDisliked: true }
      })
    },
    {
      params: idModel,
      response: 'dislike',
    },
  )
