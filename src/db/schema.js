import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
  id: integer('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const gamesTable = sqliteTable('games', {
  id: integer('id').primaryKey(),
  gameId: text('game_id').notNull(),
  isFastTrack: integer('is_fast_track').notNull().default(0),
  isCurrent: integer('is_current').notNull().default(0),
  isArchived: integer('is_archived').notNull().default(0),
  archivedAt: text('archived_at'), // Make sure this line is present
  order: integer('order').notNull(),
  userId: integer('user_id').notNull().references(() => usersTable.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});