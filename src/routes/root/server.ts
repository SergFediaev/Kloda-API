import { Elysia } from 'elysia'

export const serverRoute = new Elysia().get('server', () =>
  Bun.file('public/images/specs.jpg'),
)
