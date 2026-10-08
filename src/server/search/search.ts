import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, ilike, isNotNull } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '#/server/db/client';
import { newsPost, simulatedPlayer } from '#/server/db/schema';

export const searchPublic = createServerFn({ method: 'GET' })
  .validator(z.object({ query: z.string().trim().max(80) }))
  .handler(async ({ data }) => {
    if (!data.query) return { news: [], players: [], pages: [] };
    const term = `%${data.query}%`;
    const [news, players] = await Promise.all([
      db
        .select({
          slug: newsPost.slug,
          title: newsPost.title,
          excerpt: newsPost.excerpt,
        })
        .from(newsPost)
        .where(
          and(isNotNull(newsPost.publishedAt), ilike(newsPost.title, term)),
        )
        .orderBy(desc(newsPost.publishedAt)),
      db
        .select({
          slug: simulatedPlayer.publicSlug,
          name: simulatedPlayer.name,
          characterClass: simulatedPlayer.characterClass,
        })
        .from(simulatedPlayer)
        .where(
          and(
            eq(simulatedPlayer.visibility, 'public'),
            ilike(simulatedPlayer.name, term),
          ),
        )
        .orderBy(asc(simulatedPlayer.name)),
    ]);
    return { news, players, pages: [] };
  });
