import { type AnyColumn, type SQL, sql } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'

export const lower = (value: AnyPgColumn): SQL => sql`lower(${value})`

export const increment = (column: AnyColumn, value = 1): SQL =>
  sql`${column} + ${value}`

export const decrement = (column: AnyColumn, value = 1): SQL =>
  sql`${column} - ${value}`
