import cors from '@elysiajs/cors'
import { html } from '@elysiajs/html'
import jwt from '@elysiajs/jwt'
import staticPlugin from '@elysiajs/static'
import swagger from '@elysiajs/swagger'
import { eq, getTableColumns } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { Elysia } from 'elysia'
import { ip } from 'elysia-ip'
import { rateLimit } from 'elysia-rate-limit'
import logixlysia from 'logixlysia'
import postgres from 'postgres'
import { cards } from './db/schemas/cards.schema'
import { refreshTokens } from './db/schemas/refreshTokens.schema'
import { users } from './db/schemas/users.schema'
import { increment, lower } from './db/utils'
import { isAuthenticated } from './middlewares/isAuthenticated'
import { cardsModel } from './models/cards.model'
import { loginModel } from './models/login.model'
import { queryModel } from './models/query.model'
import { registerModel } from './models/register.model'
import { usersModel } from './models/users.model'
import { hashToken } from './utils'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw Error('Missing DATABASE_URL')
}

const refreshSecret = process.env.JWT_REFRESH_SECRET

if (!refreshSecret) {
  throw Error('Missing JWT_REFRESH_SECRET')
}

const accessSecret = process.env.JWT_ACCESS_SECRET

if (!accessSecret) {
  throw Error('Missing JWT_ACCESS_SECRET')
}

const migrationClient = postgres(connectionString, { max: 1 })
await migrate(drizzle(migrationClient, { logger: true }), {
  migrationsFolder: './drizzle',
})

const queryClient = postgres(connectionString)
export const db = drizzle(queryClient)

const FRONT_URL = 'https://kloda.fediaev.ru'

const invalidCreds = { message: 'Invalid credentials' }
const unauthorized = { message: 'Unauthorized' }

const app = new Elysia()
  .use(
    rateLimit({
      errorResponse: new Response('rate-limited: Too many requests', {
        status: 429,
        headers: new Headers({
          'Content-Type': 'text/plain',
          'Custom-Header': 'custom',
        }),
      }),
    }),
  )
  .use(
    logixlysia({
      config: {
        ip: true,
        customLogFormat:
          '🦊 {now} {level} {duration} {method} {pathname} {status} {message} {ip} {epoch}',
      },
    }),
  )
  .use(cors())
  .use(ip())
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Kloda API documentation',
          version: '1.0.0',
        },
      },
    }),
  )
  .onError(({ error, code }) => {
    console.error(error)

    if (code === 'NOT_FOUND') {
      return 'Not found 🙈'
    }
  })
  .group('v1', app =>
    app
      .use(queryModel)
      .group('cards', app =>
        app
          .use(cardsModel)
          .get('/', () => db.select().from(cards), {
            response: 'cardsResponse',
          })
          .get(
            ':id',
            ({ params: { id } }) =>
              db.select().from(cards).where(eq(cards.id, id)),
            {
              params: 'idParams',
              response: 'cardsResponse',
            },
          )
          .post('/', ({ body }) => db.insert(cards).values(body).returning(), {
            body: 'cardBody',
            response: 'cardsResponse',
          })
          .patch(
            ':id/like',
            ({ params: { id } }) =>
              db
                .update(cards)
                .set({ likes: increment(cards.likes) })
                .where(eq(cards.id, id)),
            {
              params: 'idParams',
            },
          )
          .patch(
            ':id/dislike',
            ({ params: { id } }) =>
              db
                .update(cards)
                .set({ dislikes: increment(cards.dislikes) })
                .where(eq(cards.id, id)),
            {
              params: 'idParams',
            },
          ),
      )
      .group('auth', app =>
        app
          .use(registerModel)
          .use(jwt({ name: 'jwtRefresh', secret: refreshSecret, exp: '10m' }))
          .use(jwt({ name: 'jwtAccess', secret: accessSecret, exp: '5m' }))
          .post(
            'register',
            async ({
              body: { username, email, password },
              jwtRefresh,
              jwtAccess,
              cookie,
              set,
              ip,
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

              const userId = await db.transaction(async tx => {
                const [{ userId }] = await tx
                  .insert(users)
                  .values({
                    username,
                    email,
                    hashedPassword,
                  })
                  .returning({ userId: users.id })

                await tx.insert(refreshTokens).values({
                  id: refreshId,
                  hashedToken,
                  ip,
                  userId,
                })

                return userId
              })

              const accessToken = await jwtAccess.sign({
                sub: String(userId),
              })

              // ToDo: Secure
              cookie.refreshToken.set({
                value: refreshToken,
                httpOnly: true,
              })

              return { accessToken, userId }
            },
            {
              body: 'registerBody',
              response: 'registerResponse',
              cookie: 'registerCookie',
            },
          )
          .use(loginModel)
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
              body: 'loginBody',
              response: 'loginResponse', // ToDo: Login response
              cookie: 'registerCookie', // ToDo: Login cookie
            },
          )
          .post(
            'refresh',
            async ({ cookie, jwtRefresh, jwtAccess, set, ip }) => {
              const cookieToken = cookie.refreshToken.value

              if (!cookieToken) {
                set.status = 401

                console.error('Cookie refresh token not found')

                return unauthorized
              }

              const payload = await jwtRefresh.verify(cookieToken)

              if (!payload) {
                set.status = 401

                console.error('Invalid cookie refresh token')

                return unauthorized
              }

              const tokenId = payload.sub

              if (!tokenId) {
                set.status = 401

                console.error('Cookie refresh token ID not found')

                return unauthorized
              }

              const [existingToken] = await db
                .select()
                .from(refreshTokens)
                .where(eq(refreshTokens.id, tokenId))

              if (!existingToken) {
                set.status = 401

                console.error('User refresh token not found')

                return unauthorized
              }

              const hashedCookieToken = hashToken(cookieToken)

              if (hashedCookieToken !== existingToken.hashedToken) {
                set.status = 401

                console.error("Refresh tokens don't match")

                return unauthorized
              }

              const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, existingToken.userId))

              if (!user) {
                set.status = 401

                console.error('User not found')

                return unauthorized
              }

              await db
                .delete(refreshTokens)
                .where(eq(refreshTokens.id, tokenId))

              const refreshId = crypto.randomUUID()

              const refreshToken = await jwtRefresh.sign({
                sub: refreshId,
              })

              const hashedToken = hashToken(refreshToken)

              await db.insert(refreshTokens).values({
                id: refreshId,
                hashedToken,
                ip,
                userId: user.id,
              })

              const accessToken = await jwtAccess.sign({
                sub: String(user.id),
              })

              cookie.refreshToken.set({
                value: refreshToken,
                httpOnly: true,
              })

              return { accessToken }
            },
            {
              cookie: 'registerCookie', // ToDo: Refresh cookie & onBeforeHandle()
            },
          )
          .use(isAuthenticated)
          .get('me', async ({ user, set }) => {
            if (!user) {
              set.status = 401

              console.error('User not found')

              return unauthorized
            }

            await db
              .update(users)
              .set({ lastLoginAt: new Date() })
              .where(eq(users.id, user.id))

            const { hashedPassword, ...restUser } = user

            return restUser
          })
          .post(
            'logout',
            async ({ cookie: { refreshToken }, user, set }) => {
              if (!user) {
                set.status = 401

                console.error('User not found')

                return unauthorized
              }

              await db
                .delete(refreshTokens)
                .where(eq(refreshTokens.userId, user.id))

              refreshToken.remove()
            },
            {
              cookie: 'registerCookie', // ToDo: Logout cookie
            },
          ),
      )
      .group('users', app =>
        app
          .use(usersModel)
          .get(
            '/',
            () => {
              const { hashedPassword, ...restUser } = getTableColumns(users)

              return db.select(restUser).from(users)
            },
            {
              response: 'usersResponse',
            },
          )
          .get(
            ':id',
            ({ params: { id } }) => {
              const { hashedPassword, ...restUser } = getTableColumns(users)

              return db.select(restUser).from(users).where(eq(users.id, id))
            },
            {
              params: 'idParams',
              response: 'usersResponse',
            },
          ),
      ),
  )
  .use(html())
  .use(staticPlugin())
  .get(
    '/',
    () => `
      <html lang='en'>
        <head>
          <title>Kloda API</title>
          <meta name='viewport' content='width=device-width, initial-scale=1' />
          <link rel='icon' href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".8em" font-size="110">♕</text></svg>' />
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              list-style: none;
              overflow-wrap: anywhere;
              transition: .3s;
            }
            
            html {
              min-height: 100svh;
              display: flex;
              justify-content: center;
              align-items: center;
            }
        
            body {
              background-color: black;
              color: antiquewhite;
              font-family: Arial, Helvetica, sans-serif;
              padding: 20px;
            }
            
            .background {
              background: url(/public/gifs/background.gif) no-repeat bottom right / contain;
              width: 100%;
              max-width: 265px;
              height: 100%;
              max-height: 350px;
              position: fixed;
              bottom: 0;
              right: 0;
              z-index: -1;
            }
            
            main {
              background: #1a1a1a;
              border-radius: 30px;
              padding: 20px 30px;
              display: flex;
              flex-direction: column;
              gap: 20px;
              box-shadow: 0 0 10px 1px orange;
            }
            
            main:hover {
              background-color: black;
              box-shadow: 0 0 20px 2px coral;
            }
            
            .logo {
              font-weight: normal;
            }
            
            ul {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            
            a {
              color: orange;
              text-underline-offset: 4px;
            }
            
            a:hover {
              color: coral;
            }
            
            @media screen and (max-width: 576px) {
              html {
                align-items: flex-start;
              }
              
              .background {
                background-position-x: center;
                left: 50%;
                transform: translateX(-50%);
              }
            }
          </style>
        </head>
        <body>
          <div class=background></div>
          <main>
            <h1>Kloda API <span class=logo>♕</span></h1>
            <ul>
              <li>Backend documentation: <a href=swagger>Swagger</a></li>
              <li>Backend GitHub:<br><a href=https://github.com/SergFediaev/kloda-api>github.com/SergFediaev/kloda-api</a></li>
              <li>Frontend: <a href=${FRONT_URL}>kloda.fediaev.ru</a></li>
              <li>Server: <a href=server>hardware specs</a></li>
            </ul>
            <p>© ${new Date().getFullYear()} <a href=mailto:SergFediaev@gmail.com>Sergei Fediaev</a> ✉</p>
          </main>
        </body>
      </html>
    `,
  )
  .get('server', () => Bun.file('public/images/specs.jpg'))
  .get('front', ({ redirect }) => redirect(FRONT_URL))
  .listen(3_000)

console.log(`View documentation at "${app.server?.url}swagger" in your browser`)
