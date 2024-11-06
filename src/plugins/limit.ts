import { Elysia } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'

const duration = Number(process.env.REQUESTS_DURATION)

const max = Number(process.env.MAXIMUM_REQUESTS)

export const limitPlugin = new Elysia().use(
  rateLimit({
    duration,
    max,
    errorResponse: new Response('rate-limited: Too many requests', {
      status: 429,
      headers: new Headers({
        'Content-Type': 'text/plain',
        'Custom-Header': 'custom',
      }),
    }),
  }),
)
