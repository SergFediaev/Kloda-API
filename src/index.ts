import cors from '@elysiajs/cors'
import staticPlugin from '@elysiajs/static'
import { Elysia } from 'elysia'
import { docsPlugin, limitPlugin, logPlugin } from 'plugins'
import { authRoute, cardsRoute, rootRoute, usersRoute } from 'routes'

const app = new Elysia()
  .use(cors())
  .use(staticPlugin())
  .use(limitPlugin)
  .use(logPlugin)
  .use(docsPlugin)
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
