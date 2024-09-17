import swagger from '@elysiajs/swagger'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { Elysia, t } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'
import logixlysia from 'logixlysia'
import postgres from 'postgres'
import { cards } from './db/schemas/cards'
import { cardModel } from './models/card.model'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
	throw Error('Missing DATABASE_URL')
}

// const migrationClient = postgres(connectionString, { max: 1 })
// await migrate(drizzle(migrationClient, { logger: true }), {
// 	migrationsFolder: './drizzle',
// })

const queryClient = postgres(connectionString)
const db = drizzle(queryClient)

const app = new Elysia()
	.use(
		rateLimit({
			max: 3,
			duration: 90_000,
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
	.use(swagger())
	.onError(({ error, code }) => {
		if (code === 'NOT_FOUND') {
			return 'Not Found :('
		}

		console.error(error)
	})
	.group('/v1', (app) =>
		app
			.group('/cards', (app) => app.get('/', () => db.select().from(cards)))
			.group('/card', (app) =>
				app
					.use(cardModel)
					.get(
						'/:id',
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
			),
	)
	.get('/', () => 'Hello Kloda ♠')
	.get('/redirect', ({ redirect }) => redirect('https://google.com/'))
	.listen(3_000)

console.log(`View documentation at "${app.server?.url}swagger" in your browser`)
