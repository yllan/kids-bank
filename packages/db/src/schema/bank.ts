import { 
  sqliteTable, 
  text,
 } from 'drizzle-orm/sqlite-core'


export const kidsTable = sqliteTable('kids', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  birthdate: text('birthdate').notNull(),
})