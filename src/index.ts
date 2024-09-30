import cors from '@elysiajs/cors'
import serverTiming from '@elysiajs/server-timing'
import { Elysia } from 'elysia'
import { docsPlugin, limitPlugin, logPlugin, staticPlugin } from 'plugins'
import { authRoute, cardsRoute, rootRoute, usersRoute } from 'routes'

const app = new Elysia()
  .use(cors())
  .use(serverTiming())
  .use(limitPlugin)
  .use(logPlugin)
  .use(docsPlugin)
  .use(staticPlugin)
  .onError(({ error, code }) => {
    console.error(error)

    if (code === 'NOT_FOUND') {
      return 'Not found 🙈'
    }
  })
  .use(rootRoute)
  .use(authRoute)
  .use(cardsRoute)
  .use(usersRoute)
  .listen(3_000)

console.log(`View documentation at "${app.server?.url}swagger" in your browser`)
