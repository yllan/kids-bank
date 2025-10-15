import {
  sqliteTable, text, integer
} from 'drizzle-orm/sqlite-core'
import { ulid } from 'ulid'
import { sql } from 'drizzle-orm'

const NOW = sql`(strftime('%s', 'now') * 1000)`
const timestamp = (columnName: string) => integer(columnName, { mode: 'timestamp_ms' }).default(NOW)
const idType = (columnName: string = 'id') => text(columnName)
const primary = (columnName: string = 'id') => idType(columnName).primaryKey().$default(ulid)

const commonTimestamp = {
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  deletedAt: timestamp('deleted_at').default(sql`0`)
}

export const accountsTable = sqliteTable('accounts', {
  id: primary(),
  name: text('name').notNull(),
  birthday: text('birthday').notNull(), // yyyy-mm-dd
  password: text('password'), // hashed password
  ...commonTimestamp,
})

export const clientsTable = sqliteTable('clients', {
  id: idType().primaryKey(),
})

export const changesTable = sqliteTable('changes', {
  ver: integer('version').primaryKey({ autoIncrement: true }),
  hash: text('hash').notNull().unique(), // sha256 of (account, op, table, key, payload, client, created_at)

  account: idType('account').references(() => accountsTable.id, { onDelete: 'restrict' }),
  op: text('op').notNull(),
  table: text('table').notNull(),
  key: idType('key'),
  payload: text('payload', { mode: 'json' }),

  client: idType('client').notNull().references(() => clientsTable.id),
  createdAt: timestamp('created_at').notNull(),
})

export const rulesTable = sqliteTable('rules', {
  id: primary(),
  description: text('description'),
  account: idType('account')
    .notNull()
    .references(() => accountsTable.id, { onDelete: 'restrict' }),
  amount: text('amount', { mode: 'json' }).notNull(),
  recurrence: text('recurrence', { mode: 'json' }).notNull(),
  beginAt: text('begin_at').notNull(), // yyyy-mm-dd
  endAt: text('end_at'), // yyyy-mm-dd
  ...commonTimestamp,
})

export const txsTable = sqliteTable('txs', {
  id: primary(),
  account: idType('account')
    .notNull()
    .references(() => accountsTable.id, { onDelete: 'restrict' }),
  description: text('description'),
  amount: integer('amount').notNull(), // positive for deposit, negative for withdrawal
  date: text('date').notNull(), // yyyy-mm-dd
  rule: text('rule').references(() => rulesTable.id, { onDelete: 'restrict' }), // the rule id that generated this tx, if any

  ...commonTimestamp,
})
