import { Elysia } from 'elysia'
import { loginRoute } from './login'
import { logoutRoute } from './logout'
import { meRoute } from './me'
import { refreshRoute } from './refresh'
import { registerRoute } from './register'

export const authRoute = new Elysia({
  prefix: 'v1/auth',
})
  .use(registerRoute)
  .use(loginRoute)
  .use(logoutRoute)
  .use(meRoute)
  .use(refreshRoute)
