import cors from '@elysiajs/cors'
import jwt from '@elysiajs/jwt'
import swagger from '@elysiajs/swagger'
import { eq, getTableColumns } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { Elysia, t } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'
import logixlysia from 'logixlysia'
import postgres from 'postgres'
import { cards } from './db/schemas/cards'
import { users } from './db/schemas/users'
import { lower } from './db/schemas/utils'
import { cardModel } from './models/card.model'
import { registerModel } from './models/register.model'

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
      return 'Not Found 🙈'
    }

    console.error(error)
  })
  .group('v1', app =>
    app
      .group('cards', app =>
        app
          .use(cardModel)
          .get('/', () => db.select().from(cards))
          .get(
            ':id',
            ({ params: { id } }) =>
              db.select().from(cards).where(eq(cards.id, id)),
            {
              params: t.Object({ id: t.Number() }),
            },
          )
          .post(
            '/',
            async ({ body }) => {
              const [createdCard] = await db
                .insert(cards)
                .values(body)
                .returning()

              console.log(createdCard)

              return createdCard
            },
            {
              body: 'cardBody',
              response: 'cardResponse',
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

              return { accessToken }
            },
            {
              body: 'registerBody',
              response: 'registerResponse',
            },
          ),
      )
      .group('users', app =>
        app
          .get('/', () => {
            const { password, ...restUser } = getTableColumns(users)

            return db.select(restUser).from(users)
          })
          .get(
            ':id',
            ({ params: { id } }) => {
              const { password, ...restUser } = getTableColumns(users)

              return db.select(restUser).from(users).where(eq(users.id, id))
            },
            {
              params: t.Object({ id: t.Number() }),
            },
          ),
      ),
  )
  .get('/', () => 'Hello Kloda ♠')
  .get('redirect', ({ redirect }) => redirect('https://google.com/'))
  .listen(3_000)

console.log(`View documentation at "${app.server?.url}swagger" in your browser`)
