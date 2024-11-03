import { db, refreshTokens, users } from 'db'
import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { authModels } from 'models'
import { authorizePlugin } from 'plugins'

export const logoutRoute = new Elysia()
  .use(authModels)
  .use(authorizePlugin)
  .post(
    'logout',
    async ({ cookie: { refreshToken }, user, set }) => {
      if (!user) {
        set.status = 401

        console.error('User not found')

        return { message: 'Unauthorized' }
      }

      await db.transaction(async tx => {
        await tx.delete(refreshTokens).where(eq(refreshTokens.userId, user.id))

        await tx
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id))
      })

      refreshToken.remove()
    },
    {
      cookie: 'cookie',
    },
  )
