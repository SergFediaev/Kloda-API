import { Elysia } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'

export const limitPlugin = new Elysia().use(
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
