import { db, users } from 'db'
import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { authModels } from 'models'
import { authPlugin } from 'plugins'

export const meRoute = new Elysia()
  .use(authModels)
  .use(authPlugin)
  .get(
    'me',
    async ({ user, set }) => {
      if (!user) {
        set.status = 401

        console.error('User not found')

        return { message: 'Unauthorized' }
      }

      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id))

      const { hashedPassword, ...restUser } = user

      return restUser
    },
    {
      response: 'me',
    },
  )
