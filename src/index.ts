import cors from '@elysiajs/cors'
import { html } from '@elysiajs/html'
import jwt from '@elysiajs/jwt'
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
import { cardsModel } from './models/cards.model'
import { queryModel } from './models/query.model'
import { registerModel } from './models/register.model'
import { usersModel } from './models/users.model'

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
const db = drizzle(queryClient)

const FRONT_URL = 'https://kloda.fediaev.ru'

const app = new Elysia()
  .use(
    rateLimit({
      errorResponse: new Response(
        'rate-limited: No more trolling, young hacker ;D',
        {
          status: 429,
          headers: new Headers({
            'Content-Type': 'text/plain',
            'Custom-Header': 'custom',
          }),
        },
      ),
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

              const [user] = await db
                .insert(users)
                .values({
                  username,
                  email,
                  password: hashedPassword,
                  createdCards: [],
                  favoriteCards: [],
                  likedCards: [],
                  dislikedCards: [],
                })
                .returning()

              console.log(user)

              const id = user.id

              const refreshToken = await jwt.sign({
                id,
                sub: String(id),
              })

              const hashedToken = new Bun.CryptoHasher('sha512')
                .update(refreshToken)
                .digest('hex')

              cookie.refreshToken.set({
                value: hashedToken,
                httpOnly: true,
              })

              const accessToken = await jwt.sign({ id })

              return { accessToken, id }
            },
            {
              body: 'registerBody',
              response: 'registerResponse',
              cookie: 'registerCookie',
            },
          ),
      )
      .group('users', app =>
        app
          .use(usersModel)
          .get(
            '/',
            () => {
              const { password, ...restUser } = getTableColumns(users)

              return db.select(restUser).from(users)
            },
            {
              response: 'usersResponse',
            },
          )
          .get(
            ':id',
            ({ params: { id } }) => {
              const { password, ...restUser } = getTableColumns(users)

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
  .get(
    '/',
    () => `
      <html lang='en'>
        <head>
          <title>Kloda API ♤</title>
          <meta name='viewport' content='width=device-width, initial-scale=1' />
          <style>
            html {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100svh;
              overflow-wrap: anywhere;
            }
            
            body {
              background-color: black;
              color: antiquewhite;
              font-family: Arial, Helvetica, sans-serif;
              padding: 10px;
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
          <h1>Kloda API ♤</h1>
          <ul>
            <li>Backend documentation: <a href=swagger>Swagger</a></li>
            <li>Backend GitHub:<br><a href=https://github.com/SergFediaev/kloda-api>github.com/SergFediaev/kloda-api</a></li>
            <li>Frontend: <a href=${FRONT_URL}>Kloda.Fediaev.ru</a></li>
          </ul>
          <p>© ${new Date().getFullYear()} <a href=mailto:SergFediaev@gmail.com>Sergei Fediaev</a> ✉</p>
        </body>
      </html>
    `,
  )
  .get('front', ({ redirect }) => redirect(FRONT_URL))
  .listen(3_000)

console.log(`View documentation at "${app.server?.url}swagger" in your browser`)
