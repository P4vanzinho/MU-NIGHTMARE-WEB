import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

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

export const newsComment = pgTable('news_comment', {
  id: text('id').primaryKey(),
  postId: text('post_id')
    .notNull()
    .references(() => newsPost.id, { onDelete: 'cascade' }),
  authorId: text('author_id')
    .notNull()
    .references(() => user.id),
  body: text('body').notNull(),
  status: text('status').notNull().default('visible'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const newsLike = pgTable(
  'news_like',
  {
    id: text('id').primaryKey(),
    postId: text('post_id')
      .notNull()
      .references(() => newsPost.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('news_like_post_user_idx').on(table.postId, table.userId),
  ],
);

export const bugReport = pgTable('bug_report', {
  id: text('id').primaryKey(),
  protocol: text('protocol').notNull().unique(),
  reporterId: text('reporter_id')
    .notNull()
    .references(() => user.id),
  title: text('title').notNull(),
  steps: text('steps').notNull(),
  impact: text('impact').notNull(),
  status: text('status').notNull().default('submitted'),
  severity: text('severity'),
  adminNote: text('admin_note'),
  rewardStatus: text('reward_status').notNull().default('pending'),
  rewardReason: text('reward_reason'),
  reviewedBy: text('reviewed_by').references(() => user.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const simulatedPlayer = pgTable('simulated_player', {
  id: text('id').primaryKey(),
  publicSlug: text('public_slug').notNull().unique(),
  name: text('name').notNull(),
  characterClass: text('character_class').notNull(),
  level: integer('level').notNull(),
  score: integer('score').notNull(),
  visibility: text('visibility').notNull().default('public'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
