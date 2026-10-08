import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { z } from 'zod';

import { getRequiredAdminSession } from '#/server/auth/session';
import { user } from '#/server/db/auth-schema';
import { db } from '#/server/db/client';
import { newsPost } from '#/server/db/schema';

const postInput = z.object({
  title: z.string().trim().min(3).max(140),
  excerpt: z.string().trim().min(3).max(280),
  content: z.string().trim().min(3).max(30_000),
  category: z.string().trim().min(2).max(40),
  coverImage: z.string().trim().url().optional().or(z.literal('')),
  publish: z.boolean(),
});

const updateInput = postInput.extend({ id: z.string().min(1) });

export type NewsPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverImage: string | null;
  publishedAt: string | null;
};

export type NewsPostDetail = NewsPostSummary & {
  content: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminNewsPost = NewsPostSummary & { content: string };

function toSummary(post: typeof newsPost.$inferSelect): NewsPostSummary {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    coverImage: post.coverImage,
    publishedAt: post.publishedAt?.toISOString() ?? null,
  };
}

function makeSlug(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
}

async function uniqueSlug(title: string, currentId?: string) {
  const base = makeSlug(title) || 'noticia';
  let slug = base;
  let suffix = 2;
  while (true) {
    const [existing] = await db
      .select({ id: newsPost.id })
      .from(newsPost)
      .where(eq(newsPost.slug, slug))
      .limit(1);
    if (!existing || existing.id === currentId) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export const getPublishedNews = createServerFn({ method: 'GET' }).handler(
  async () => {
    const posts = await db
      .select()
      .from(newsPost)
      .where(isNotNull(newsPost.publishedAt))
      .orderBy(desc(newsPost.publishedAt));
    return posts.map(toSummary);
  },
);

export const getNewsPost = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }): Promise<NewsPostDetail | null> => {
    const [post] = await db
      .select({
        post: newsPost,
        authorName: user.name,
      })
      .from(newsPost)
      .innerJoin(user, eq(newsPost.authorId, user.id))
      .where(and(eq(newsPost.slug, data.slug), isNotNull(newsPost.publishedAt)))
      .limit(1);
    if (!post) return null;
    return {
      ...toSummary(post.post),
      content: post.post.content,
      authorName: post.authorName,
      createdAt: post.post.createdAt.toISOString(),
      updatedAt: post.post.updatedAt.toISOString(),
    };
  });

export const getAdminNews = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminNewsPost[]> => {
    await getRequiredAdminSession();
    const posts = await db
      .select()
      .from(newsPost)
      .orderBy(desc(newsPost.createdAt));
    return posts.map((post) => ({ ...toSummary(post), content: post.content }));
  },
);

export const createNewsPost = createServerFn({ method: 'POST' })
  .validator(postInput)
  .handler(async ({ data }) => {
    const session = await getRequiredAdminSession();
    const now = new Date();
    const [post] = await db
      .insert(newsPost)
      .values({
        id: crypto.randomUUID(),
        slug: await uniqueSlug(data.title),
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        coverImage: data.coverImage || null,
        authorId: session.user.id,
        publishedAt: data.publish ? now : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return toSummary(post);
  });

export const updateNewsPost = createServerFn({ method: 'POST' })
  .validator(updateInput)
  .handler(async ({ data }) => {
    await getRequiredAdminSession();
    const now = new Date();
    const [current] = await db
      .select({ id: newsPost.id, publishedAt: newsPost.publishedAt })
      .from(newsPost)
      .where(eq(newsPost.id, data.id))
      .limit(1);
    if (!current) throw new Error('Notícia não encontrada.');
    const [post] = await db
      .update(newsPost)
      .set({
        slug: await uniqueSlug(data.title, data.id),
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        coverImage: data.coverImage || null,
        publishedAt: data.publish ? (current.publishedAt ?? now) : null,
        updatedAt: now,
      })
      .where(eq(newsPost.id, data.id))
      .returning();
    return toSummary(post);
  });
