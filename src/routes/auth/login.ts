import { db, lower, refreshTokens, users } from 'db'
import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { ip } from 'elysia-ip'
import { authModels } from 'models'
import { jwtAccessPlugin, jwtRefreshPlugin } from 'plugins'
import { hashToken } from 'utils'

const invalidCreds = { message: 'Invalid credentials' }

export const loginRoute = new Elysia()
  .use(authModels)
  .use(jwtRefreshPlugin)
  .use(jwtAccessPlugin)
  .use(ip())
  .post(
    'login',
    async ({
      body: { email, password },
      set,
      jwtRefresh,
      jwtAccess,
      cookie,
      ip,
    }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(lower(users.email), email.toLowerCase()))

      if (!user) {
        set.status = 403

        console.error('User not found')

        return invalidCreds
      }

      const isPasswordValid = await Bun.password.verify(
        password,
        user.hashedPassword,
      )

      if (!isPasswordValid) {
        set.status = 403

        console.error('Invalid password')

        return invalidCreds
      }

      const refreshId = crypto.randomUUID()

      const refreshToken = await jwtRefresh.sign({
        sub: refreshId,
      })

      const hashedToken = hashToken(refreshToken)

      const userId = user.id

      await db.transaction(async tx => {
        await tx
          .insert(refreshTokens)
          .values({ id: refreshId, hashedToken, ip, userId })

        await tx
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, userId))
      })

      const accessToken = await jwtAccess.sign({
        sub: String(userId),
      })

      cookie.refreshToken.set({
        value: refreshToken,
        httpOnly: true,
      })

      return { accessToken, userId }
    },
    {
      body: 'login',
      response: 'auth',
      cookie: 'cookie',
    },
  )
