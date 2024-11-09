import { Elysia } from 'elysia'
import { frontRoute } from './front'
import { serverRoute } from './server'
import { uptimeRoute } from './uptime'

export const rootRoute = new Elysia()
  .use(serverRoute)
  .use(frontRoute)
  .use(uptimeRoute)
  .get('', () => Bun.file('public/index.html'))
