import swagger from '@elysiajs/swagger'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { Elysia, t } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'
import postgres from 'postgres'
import { cards } from '../db/schema/cards'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
	throw Error('Missing DATABASE_URL')
}

const migrationClient = postgres(connectionString, { max: 1 })
await migrate(drizzle(migrationClient), { migrationsFolder: './drizzle' })

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
	.use(swagger())
	.get('/', () => 'Hello Kloda  ♠ ♣ ♤ ♧ 🃏')
	.get('/get-all-cards', () => db.select().from(cards), {
		response: t.Object({
			name: t.String(),
		}),
	})
	.get(
		'/get-card/:id',
		({ params: { id } }) => db.select().from(cards).where(eq(cards.id, id)),
		{ params: t.Object({ id: t.Number() }) },
	)
	// .post('/create-card', ({ body }) => {
	// 	db.insert(cards).values(body)
	// })
	.listen(3_000)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)

console.log(`View documentation at "${app.server?.url}swagger" in your browser`)

// type Card = {
// 	id: number
// 	title: string
// 	content: string
// 	category: string[]
// 	likes?: number
// 	dislikes?: number
// 	author: string
// }
