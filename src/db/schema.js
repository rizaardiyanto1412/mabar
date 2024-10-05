import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const gamesTable = sqliteTable('games', {
  id: integer('id').primaryKey(),
  gameId: text('game_id').notNull(),
  isFastTrack: integer('is_fast_track').notNull().default(0),
  isCurrent: integer('is_current').notNull().default(0),
  order: integer('order').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});