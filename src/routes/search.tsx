import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { searchPublic } from '#/server/search/search';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/search')({
  loader: ({ location }) =>
    searchPublic({
      data: { query: new URLSearchParams(location.search).get('q') ?? '' },
    }),
  component: SearchPage,
});

function SearchPage() {
  const results = Route.useLoaderData();
  const [query, setQuery] = useState('');
  return (
    <PageShell>
      <section className="content-section search-page">
        <p className="eyebrow">BUSCA</p>
        <h1>Buscar no portal</h1>
        <form
          className="ranking-search"
          onSubmit={(event) => {
            event.preventDefault();
            window.location.href = `/search?q=${encodeURIComponent(query)}`;
          }}
        >
          <label>
            Termo de busca
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button type="submit" className="button button-secondary">
            Buscar
          </button>
        </form>
        <div className="search-results">
          {results.news.map((item) => (
            <a
              className="search-result"
              href={`/news/${item.slug}`}
              key={`news-${item.slug}`}
            >
              <strong>{item.title}</strong>
              <span>Notícia · {item.excerpt}</span>
            </a>
          ))}
          {results.players.map((item) => (
            <a
              className="search-result"
              href={`/ranking/${item.slug}`}
              key={`player-${item.slug}`}
            >
              <strong>{item.name}</strong>
              <span>Perfil público · {item.characterClass}</span>
            </a>
          ))}
          {results.news.length === 0 && results.players.length === 0 && (
            <p className="form-help">Nenhum resultado público encontrado.</p>
          )}
        </div>
      </section>
    </PageShell>
  );
}
