import { createFileRoute } from '@tanstack/react-router';

import { getPublishedNews } from '#/server/news/news';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/news')({
  loader: () => getPublishedNews(),
  component: NewsPage,
});

function NewsPage() {
  const posts = Route.useLoaderData();
  return (
    <PageShell>
      <section className="content-section news-page">
        <p className="eyebrow">NOTÍCIAS</p>
        <h1>Últimas notícias</h1>
        <div className="news-list">
          {posts.length === 0 ? (
            <p className="form-help">Nenhuma notícia publicada ainda.</p>
          ) : (
            posts.map((post) => (
              <article className="news-post-preview" key={post.id}>
                {post.coverImage && (
                  <img src={post.coverImage} alt="" loading="lazy" />
                )}
                <div>
                  <span>{post.category}</span>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <a className="text-link" href={`/news/${post.slug}`}>
                    Ler notícia
                  </a>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}
