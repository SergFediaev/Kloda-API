import { Elysia } from 'elysia'
import { frontRoute } from './front'
import { serverRoute } from './server'

export const rootRoute = new Elysia()
  .use(serverRoute)
  .use(frontRoute)
  .get('', () => Bun.file('public/index.html'))
