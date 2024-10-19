import cors from '@elysiajs/cors'
import serverTiming from '@elysiajs/server-timing'
import { Elysia } from 'elysia'
import { docsPlugin, limitPlugin, logPlugin, staticPlugin } from 'plugins'
import {
  authRoute,
  cardsRoute,
  categoriesRoute,
  rootRoute,
  usersRoute,
} from 'routes'

const port = process.env.PORT

if (!port) {
  throw Error('Missing PORT')
}

new Elysia()
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
  .use(categoriesRoute)
  .listen(port, ({ url }) =>
    console.log(`View documentation at "${url}swagger" in your browser`),
  )
