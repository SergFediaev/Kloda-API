import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
	throw new Error('Missing DATABASE_URL')
}

export default defineConfig({
	schema: ['./db/schema/**/*.ts'],
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
})
