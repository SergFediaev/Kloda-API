import { Elysia } from 'elysia'
import { frontRoute } from './front'
import { serverRoute } from './server'
import { statsRoute } from './stats'
import { uptimeRoute } from './uptime'

export const rootRoute = new Elysia()
  .use(serverRoute)
  .use(frontRoute)
  .use(uptimeRoute)
  .use(statsRoute)
  .get('', () => Bun.file('public/index.html'))
