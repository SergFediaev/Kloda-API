import { db, lower, refreshTokens, users } from 'db'
import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { ip } from 'elysia-ip'
import { authModels } from 'models'
import { jwtAccessPlugin, jwtRefreshPlugin } from 'plugins'
import { getRefreshConfig, hashToken, parseUserAgent } from 'utils'

export const registerRoute = new Elysia()
  .use(authModels)
  .use(jwtRefreshPlugin)
  .use(jwtAccessPlugin)
  .use(ip())
  .post(
    'register',
    async ({
      body: { username, email, password },
      jwtRefresh,
      jwtAccess,
      cookie,
      set,
      ip,
      request: { headers },
    }) => {
      // ToDo: Return bool instead of user
      const isUsernameExisting = await db
        .select()
        .from(users)
        .where(eq(lower(users.username), username.toLowerCase()))

      if (isUsernameExisting.length) {
        set.status = 400

        return { message: 'Username already exists' }
      }

      const isEmailExisting = await db
        .select()
        .from(users)
        .where(eq(lower(users.email), email.toLowerCase()))

      if (isEmailExisting.length) {
        set.status = 400

        return { message: 'Email already exists' }
      }

      const hashedPassword = await Bun.password.hash(password)

      const refreshId = crypto.randomUUID()

      const refreshToken = await jwtRefresh.sign({
        sub: refreshId,
      })

      const hashedToken = hashToken(refreshToken)

      const { expiresAt, refreshConfig } = getRefreshConfig()

      const userId = await db.transaction(async tx => {
        const [{ userId }] = await tx
          .insert(users)
          .values({
            username,
            email,
            hashedPassword,
          })
          .returning({ userId: users.id })

        const userAgent = parseUserAgent(headers)

        await tx.insert(refreshTokens).values({
          id: refreshId,
          hashedToken,
          ip,
          userId,
          userAgent,
          expiresAt,
        })

        return userId
      })

      const accessToken = await jwtAccess.sign({
        sub: String(userId),
      })

      cookie.refreshToken.set({
        value: refreshToken,
        ...refreshConfig,
      })

      return { accessToken, userId }
    },
    {
      body: 'register',
      response: 'auth',
      cookie: 'cookie',
    },
  )
