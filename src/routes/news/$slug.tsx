import { createFileRoute, notFound } from '@tanstack/react-router';

import { getNewsPost } from '#/server/news/news';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/news/$slug')({
  loader: async ({ params }) => {
    const post = await getNewsPost({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return post;
  },
  component: NewsPostPage,
});

function NewsPostPage() {
  const post = Route.useLoaderData();
  return (
    <PageShell>
      <article className="news-post">
        <p className="eyebrow">{post.category}</p>
        <h1>{post.title}</h1>
        <p className="news-post-excerpt">{post.excerpt}</p>
        <div className="news-post-meta">
          <span>Por {post.authorName}</span>
          <time dateTime={post.publishedAt ?? post.createdAt}>
            {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString(
              'pt-BR',
            )}
          </time>
        </div>
        {post.coverImage && (
          <img className="news-post-cover" src={post.coverImage} alt="" />
        )}
        <div className="news-post-content">
          {post.content.split('\n\n').map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </PageShell>
  );
}
