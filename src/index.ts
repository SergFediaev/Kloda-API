import cors from '@elysiajs/cors'
import { html } from '@elysiajs/html'
import jwt from '@elysiajs/jwt'
import staticPlugin from '@elysiajs/static'
import swagger from '@elysiajs/swagger'
import { eq, getTableColumns } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { Elysia } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'
import logixlysia from 'logixlysia'
import postgres from 'postgres'
import { cards } from './db/schemas/cards'
import { users } from './db/schemas/users'
import { increment, lower } from './db/schemas/utils'
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

const secret = process.env.JWT_SECRET

if (!secret) {
  throw Error('Missing JWT_SECRET')
}

const migrationClient = postgres(connectionString, { max: 1 })
await migrate(drizzle(migrationClient, { logger: true }), {
  migrationsFolder: './drizzle',
})

const queryClient = postgres(connectionString)
export const db = drizzle(queryClient)

const FRONT_URL = 'https://kloda.fediaev.ru'

const unauthorized = { message: 'Unauthorized' }
const ACCESS_TOKEN_EXP = 5 * 60 // 5 minutes
const REFRESH_TOKEN_EXP = 7 * 86400 // 7 days

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
          .use(jwt({ secret }))
          .post(
            'register',
            async ({
              body: { username, email, password },
              jwt,
              cookie,
              set,
            }) => {
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

              const refreshToken = await jwt.sign({
                sub: crypto.randomUUID(),
                exp: REFRESH_TOKEN_EXP,
              })

              const hashedToken = hashToken(refreshToken)

              const [user] = await db
                .insert(users)
                .values({
                  username,
                  email,
                  password: hashedPassword,
                  refreshToken: hashedToken,
                })
                .returning()

              const id = user.id

              const accessToken = await jwt.sign({
                sub: String(id),
                exp: ACCESS_TOKEN_EXP,
              })

              cookie.refreshToken.set({
                value: refreshToken,
                httpOnly: true,
                maxAge: REFRESH_TOKEN_EXP,
              })

              return { accessToken, id }
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
            async ({ body: { email, password }, set, jwt }) => {
              const [user] = await db
                .select()
                .from(users)
                .where(eq(lower(users.email), email.toLowerCase()))

              if (!user) {
                set.status = 403

                console.error('User not found')

                return { message: 'Invalid credentials' }
              }

              const isPasswordValid = await Bun.password.verify(
                password,
                user.password,
              )

              if (!isPasswordValid) {
                set.status = 403

                console.error('Invalid password')

                return { message: 'Invalid credentials' }
              }

              const refreshToken = await jwt.sign({
                sub: crypto.randomUUID(),
                exp: REFRESH_TOKEN_EXP,
              })

              const hashedToken = hashToken(refreshToken)

              const id = user.id

              await db
                .update(users)
                .set({ refreshToken: hashedToken })
                .where(eq(users.id, id))

              const accessToken = await jwt.sign({
                sub: String(id),
                exp: ACCESS_TOKEN_EXP,
              })

              return { accessToken, id }
            },
            {
              body: 'loginBody',
              response: 'loginResponse', // ToDo: Login response
            },
          )
          .post('logout', () => 'Logout') // ToDo: Logout
          .post(
            'refresh',
            async ({ cookie, jwt, set }) => {
              const cookieToken = cookie.refreshToken.value

              if (!cookieToken) {
                set.status = 401

                console.error('Refresh token not found')

                return unauthorized
              }

              const payload = await jwt.verify(cookieToken)

              if (!payload) {
                set.status = 401

                console.error('Invalid refresh token')

                return unauthorized
              }

              const id = payload.sub

              const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, Number(id)))

              if (!user) {
                set.status = 401

                console.error('User not found')

                return unauthorized
              }

              if (!user.refreshToken) {
                set.status = 401

                console.error('User refresh token not found')

                return unauthorized
              }

              const hashedCookieToken = hashToken(cookieToken)

              if (hashedCookieToken !== user.refreshToken) {
                set.status = 401

                console.error("Refresh tokens don't match")

                return unauthorized
              }

              const refreshToken = await jwt.sign({
                sub: crypto.randomUUID(),
                exp: REFRESH_TOKEN_EXP,
              })

              const hashedToken = hashToken(refreshToken)

              await db
                .update(users)
                .set({ refreshToken: hashedToken })
                .where(eq(users.id, user.id))

              const accessToken = await jwt.sign({
                sub: String(user.id),
                exp: ACCESS_TOKEN_EXP,
              })

              cookie.refreshToken.set({
                value: refreshToken,
                httpOnly: true,
                maxAge: REFRESH_TOKEN_EXP,
              })

              return { accessToken }
            },
            {
              cookie: 'registerCookie', // ToDo: Refresh cookie & onBeforeHandle()
            },
          )
          .use(isAuthenticated)
          .get('me', ({ user, set }) => {
            if (!user) {
              set.status = 401

              console.error('User not found')

              return unauthorized
            }

            const { password, refreshToken, ...restUser } = user

            return restUser
          }),
      )
      .group('users', app =>
        app
          .use(usersModel)
          .get(
            '/',
            () => {
              const { password, refreshToken, ...restUser } =
                getTableColumns(users)

              return db.select(restUser).from(users)
            },
            {
              response: 'usersResponse',
            },
          )
          .get(
            ':id',
            ({ params: { id } }) => {
              const { password, refreshToken, ...restUser } =
                getTableColumns(users)

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
          <link rel='icon' href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".8em" font-size="120">♧</text></svg>' />
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
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100svh;
            }
        
            body {
              background-color: black;
              color: antiquewhite;
              font-family: Arial, Helvetica, sans-serif;
              padding: 20px;
            }
            
            .background {
              background: url(/public/gifs/background.gif) no-repeat center / contain;
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
          </style>
        </head>
        <body>
          <div class='background'></div>
          <main>
            <h1>Kloda API ♧</h1>
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
