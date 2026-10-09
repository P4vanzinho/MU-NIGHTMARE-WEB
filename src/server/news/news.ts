import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import {
  getCurrentSession,
  getRequiredAdminSession,
} from '#/server/auth/session';
import { user } from '#/server/db/auth-schema';
import { db } from '#/server/db/client';
import {
  adminAuditEvent,
  newsComment,
  newsLike,
  newsPost,
} from '#/server/db/schema';

const postInput = z.object({
  title: z.string().trim().min(3).max(140),
  excerpt: z.string().trim().min(3).max(280),
  content: z.string().trim().min(3).max(30_000),
  category: z.string().trim().min(2).max(40),
  coverImage: z.string().trim().url().optional().or(z.literal('')),
  publish: z.boolean(),
});

const updateInput = postInput.extend({ id: z.string().min(1) });
const likeInput = z.object({
  slug: z.string().min(1),
  liked: z.boolean(),
});
const commentInput = z.object({
  slug: z.string().min(1),
  body: z.string().trim().min(2).max(2_000),
});
const moderateCommentInput = z.object({
  commentId: z.string().min(1),
  status: z.enum(['visible', 'hidden']),
  reason: z.string().trim().min(3).max(500),
});

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
  likeCount: number;
  likedByViewer: boolean;
  comments: NewsCommentView[];
};

export type AdminNewsPost = NewsPostSummary & { content: string };

export type NewsCommentView = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type AdminComment = NewsCommentView & {
  postId: string;
  postTitle: string;
  status: string;
};

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
    const viewer = await getCurrentSession();
    const comments = await db
      .select({
        id: newsComment.id,
        body: newsComment.body,
        authorId: newsComment.authorId,
        authorName: user.name,
        createdAt: newsComment.createdAt,
      })
      .from(newsComment)
      .innerJoin(user, eq(newsComment.authorId, user.id))
      .where(
        and(
          eq(newsComment.postId, post.post.id),
          eq(newsComment.status, 'visible'),
        ),
      )
      .orderBy(asc(newsComment.createdAt));
    const [{ count: likeCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsLike)
      .where(eq(newsLike.postId, post.post.id));
    const viewerLike = viewer
      ? await db
          .select({ id: newsLike.id })
          .from(newsLike)
          .where(
            and(
              eq(newsLike.postId, post.post.id),
              eq(newsLike.userId, viewer.user.id),
            ),
          )
          .limit(1)
      : [];
    return {
      ...toSummary(post.post),
      content: post.post.content,
      authorName: post.authorName,
      createdAt: post.post.createdAt.toISOString(),
      updatedAt: post.post.updatedAt.toISOString(),
      likeCount: Number(likeCount),
      likedByViewer: viewerLike.length > 0,
      comments: comments.map((comment) => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
      })),
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

export const setNewsLike = createServerFn({ method: 'POST' })
  .validator(likeInput)
  .handler(async ({ data }) => {
    const viewer = await getCurrentSession();
    if (!viewer) throw new Error('Entre para interagir com a notícia.');
    const [post] = await db
      .select({ id: newsPost.id })
      .from(newsPost)
      .where(and(eq(newsPost.slug, data.slug), isNotNull(newsPost.publishedAt)))
      .limit(1);
    if (!post) throw new Error('Notícia não encontrada.');

    if (data.liked) {
      await db
        .insert(newsLike)
        .values({
          id: crypto.randomUUID(),
          postId: post.id,
          userId: viewer.user.id,
          createdAt: new Date(),
        })
        .onConflictDoNothing();
    } else {
      await db
        .delete(newsLike)
        .where(
          and(
            eq(newsLike.postId, post.id),
            eq(newsLike.userId, viewer.user.id),
          ),
        );
    }
    return { liked: data.liked };
  });

export const createNewsComment = createServerFn({ method: 'POST' })
  .validator(commentInput)
  .handler(async ({ data }) => {
    const viewer = await getCurrentSession();
    if (!viewer) throw new Error('Entre para comentar.');
    const [post] = await db
      .select({ id: newsPost.id })
      .from(newsPost)
      .where(and(eq(newsPost.slug, data.slug), isNotNull(newsPost.publishedAt)))
      .limit(1);
    if (!post) throw new Error('Notícia não encontrada.');
    const id = crypto.randomUUID();
    const createdAt = new Date();
    await db.insert(newsComment).values({
      id,
      postId: post.id,
      authorId: viewer.user.id,
      body: data.body,
      status: 'visible',
      createdAt,
      updatedAt: createdAt,
    });
    return {
      id,
      body: data.body,
      authorId: viewer.user.id,
      authorName: viewer.user.name,
      createdAt: createdAt.toISOString(),
    } satisfies NewsCommentView;
  });

export const removeNewsComment = createServerFn({ method: 'POST' })
  .validator(z.object({ commentId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const viewer = await getCurrentSession();
    if (!viewer) throw new Error('Entre para remover um comentário.');
    const [comment] = await db
      .select({ authorId: newsComment.authorId })
      .from(newsComment)
      .where(eq(newsComment.id, data.commentId))
      .limit(1);
    if (!comment || comment.authorId !== viewer.user.id) {
      throw new Error('Você só pode remover seus próprios comentários.');
    }
    await db.delete(newsComment).where(eq(newsComment.id, data.commentId));
    return { ok: true };
  });

export const getAdminComments = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminComment[]> => {
    await getRequiredAdminSession();
    const comments = await db
      .select({
        id: newsComment.id,
        body: newsComment.body,
        authorId: newsComment.authorId,
        authorName: user.name,
        createdAt: newsComment.createdAt,
        postId: newsPost.id,
        postTitle: newsPost.title,
        status: newsComment.status,
      })
      .from(newsComment)
      .innerJoin(user, eq(newsComment.authorId, user.id))
      .innerJoin(newsPost, eq(newsComment.postId, newsPost.id))
      .orderBy(desc(newsComment.createdAt));
    return comments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
    }));
  },
);

export const moderateNewsComment = createServerFn({ method: 'POST' })
  .validator(moderateCommentInput)
  .handler(async ({ data }) => {
    const adminSession = await getRequiredAdminSession();
    const [comment] = await db
      .select({ authorId: newsComment.authorId })
      .from(newsComment)
      .where(eq(newsComment.id, data.commentId))
      .limit(1);
    if (!comment) throw new Error('Comentário não encontrado.');
    await db
      .update(newsComment)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(newsComment.id, data.commentId));
    await db.insert(adminAuditEvent).values({
      id: crypto.randomUUID(),
      actorUserId: adminSession.user.id,
      targetUserId: comment.authorId,
      action: data.status === 'hidden' ? 'comment.hidden' : 'comment.restored',
      reason: data.reason,
      createdAt: new Date(),
    });
    return { ok: true };
  });
