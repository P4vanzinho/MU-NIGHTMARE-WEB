import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
export const siteSettings = pgTable('site_settings', {
  id: text('id').primaryKey(),
  news: jsonb('news').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
export const simulatedServerStatus = pgTable('simulated_server_status', {
  id: text('id').primaryKey(),
  onlinePlayers: integer('online_players').notNull(),
  experienceRate: integer('experience_rate').notNull(),
  dropRate: integer('drop_rate').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
