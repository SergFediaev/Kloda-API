import { db, refreshTokens, users } from 'db'
import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { ip } from 'elysia-ip'
import { authModels } from 'models'
import { jwtAccessPlugin, jwtRefreshPlugin } from 'plugins'
import { getRefreshConfig, hashToken, parseUserAgent } from 'utils'

const UNAUTHORIZED = { message: 'Unauthorized' } as const

export const refreshRoute = new Elysia()
  .use(authModels)
  .use(jwtRefreshPlugin)
  .use(jwtAccessPlugin)
  .use(ip())
  .post(
    'refresh',
    async ({
      cookie,
      jwtRefresh,
      jwtAccess,
      set,
      ip,
      request: { headers },
    }) => {
      const cookieToken = cookie.refreshToken.value

      if (!cookieToken) {
        set.status = 401

        console.error('Cookie refresh token not found')

        return UNAUTHORIZED
      }

      const payload = await jwtRefresh.verify(cookieToken)

      if (!payload) {
        set.status = 401

        console.error('Invalid cookie refresh token')

        return UNAUTHORIZED
      }

      const tokenId = payload.sub

      if (!tokenId) {
        set.status = 401

        console.error('Cookie refresh token ID not found')

        return UNAUTHORIZED
      }

      const [existingToken] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.id, tokenId))

      if (!existingToken) {
        set.status = 401

        console.error('User refresh token not found')

        return UNAUTHORIZED
      }

      const hashedCookieToken = hashToken(cookieToken)

      if (hashedCookieToken !== existingToken.hashedToken) {
        set.status = 401

        console.error("Refresh tokens don't match")

        return UNAUTHORIZED
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, existingToken.userId))

      if (!user) {
        set.status = 401

        console.error('User not found')

        return UNAUTHORIZED
      }

      await db.delete(refreshTokens).where(eq(refreshTokens.id, tokenId))

      const refreshId = crypto.randomUUID()

      const refreshToken = await jwtRefresh.sign({
        sub: refreshId,
      })

      const hashedToken = hashToken(refreshToken)

      const userAgent = parseUserAgent(headers)

      const { expiresAt, refreshConfig } = getRefreshConfig()

      await db.insert(refreshTokens).values({
        id: refreshId,
        hashedToken,
        ip,
        userId: user.id,
        userAgent,
        expiresAt,
      })

      const accessToken = await jwtAccess.sign({
        sub: String(user.id),
      })

      cookie.refreshToken.set({
        value: refreshToken,
        ...refreshConfig,
      })

      return { accessToken }
    },
    {
      response: 'refresh',
      cookie: 'cookie', // ToDo: onBeforeHandle()
    },
  )
