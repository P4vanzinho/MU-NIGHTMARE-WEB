import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { user } from './auth-schema';
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

export const adminAuditEvent = pgTable('admin_audit_event', {
  id: text('id').primaryKey(),
  actorUserId: text('actor_user_id')
    .notNull()
    .references(() => user.id),
  targetUserId: text('target_user_id')
    .notNull()
    .references(() => user.id),
  action: text('action').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const newsPost = pgTable('news_post', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  coverImage: text('cover_image'),
  authorId: text('author_id')
    .notNull()
    .references(() => user.id),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
