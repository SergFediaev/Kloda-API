import { cards, db, insertCategories } from 'db'
import { Elysia, t } from 'elysia'
import { messageModel } from 'models'
import { authorizePlugin } from 'plugins'
import type { Nullable } from 'types'

const IMPORT_CARDS_LIMIT = Number(process.env.IMPORT_CARDS_LIMIT || 10)
const key = process.env.GOOGLE_SHEETS_API_KEY

if (!key) {
  throw Error('Missing GOOGLE_SHEETS_API_KEY')
}

export const importRoute = new Elysia().use(authorizePlugin).post(
  'import',
  async ({
    body: { spreadsheetId, sheetName, skipFirstRow, skipFirstColumn },
    user,
    set,
  }) => {
    if (!user) {
      set.status = 401

      console.error('User not found')

      return { message: 'Unauthorized' }
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${key}`,
      )

      if (!response.ok) {
        const error = await response.text()
        set.status = response.status
        const message = `Failed to fetch spreadsheet: ${error}`

        console.error(message)

        return { message }
      }

      const data: Nullable<{ values?: Array<string | undefined>[] }> =
        await response.json()

      if (!data?.values) {
        set.status = 400
        const message = 'Data not found in sheet'

        console.error(message)

        return { message }
      }

      const rows = skipFirstRow ? data.values.slice(1) : data.values
      const importCardsCount = rows.length

      if (!importCardsCount) {
        set.status = 400
        const message = 'Rows not found in sheet'

        console.error(message)

        return { message }
      }

      if (importCardsCount > IMPORT_CARDS_LIMIT) {
        set.status = 400
        const message = `Import cards limit exceeded: ${importCardsCount}/${IMPORT_CARDS_LIMIT}`

        console.error(message)

        return { message }
      }

      const sheetCards: {
        title: string
        content: string
        categories: string[]
      }[] = []

      for (const row of rows) {
        const cells = skipFirstColumn ? row.slice(1) : row

        if (cells.length < 3) {
          continue
        }

        const title = cells[0]?.trim()
        const content = cells[1]?.trim()
        const categories =
          cells[2]
            ?.trim()
            .split(',')
            .map(category => category.trim())
            .filter(Boolean) ?? []

        if (!title || !content) {
          continue
        }

        sheetCards.push({ title, content, categories })
      }

      const importedCardsCount = await db.transaction(async tx => {
        const createdCards = await tx
          .insert(cards)
          .values(
            sheetCards.map(({ title, content }) => ({
              title,
              content,
              authorId: user.id,
            })),
          )
          .returning({ cardId: cards.id })

        await Promise.all(
          createdCards.map(({ cardId }, index) =>
            insertCategories(tx, sheetCards[index].categories, cardId),
          ),
        )

        return createdCards.length
      })

      return { importedCardsCount }
    } catch (error) {
      set.status = 500
      const message = `Error importing ${user.username} cards: ${error}`

      console.error(message)

      return { message }
    }
  },
  {
    body: t.Object({
      spreadsheetId: t.String(),
      sheetName: t.String(),
      skipFirstRow: t.Boolean(),
      skipFirstColumn: t.Boolean(),
    }),
    response: t.Union([
      t.Object({
        importedCardsCount: t.Number(),
      }),
      messageModel,
    ]),
  },
)
