import { Elysia } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'

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
	.get('/', () => 'Hello Kloda  ♠ ♣ ♤ ♧ 🃏')
	.listen(3_000)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
