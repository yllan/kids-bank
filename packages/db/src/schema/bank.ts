import { 
  sqliteTable, text,
} from 'drizzle-orm/sqlite-core'
import { ulid } from 'ulid'

export const kidsTable = sqliteTable('kids', {
  id: text('id').primaryKey().$defaultFn(ulid),
  name: text('name').notNull(),
  birthday: text('birthday').notNull(), // yyyy-mm-dd
})
