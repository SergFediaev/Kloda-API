import { defineConfig } from 'drizzle-kit'

const url = process.env.DATABASE_URL

if (!url) {
  throw new Error('Missing DATABASE_URL')
}

// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  schema: './src/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
})
