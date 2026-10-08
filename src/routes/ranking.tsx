import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { getRanking } from '#/server/ranking/ranking';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/ranking')({
  loader: ({ location }) =>
    getRanking({
      data: {
        search: new URLSearchParams(location.search).get('search') ?? undefined,
      },
    }),
  component: RankingPage,
});

function RankingPage() {
  const ranking = Route.useLoaderData();
  const [search, setSearch] = useState('');
  return (
    <PageShell>
      <section className="content-section ranking-page">
        <p className="eyebrow">RANKING</p>
        <h1>Os melhores do Nightmare</h1>
        <form
          className="ranking-search"
          onSubmit={(event) => {
            event.preventDefault();
            window.location.href = `/ranking?search=${encodeURIComponent(search)}`;
          }}
        >
          <label>
            Buscar jogador ou classe
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ex.: Raven"
            />
          </label>
          <button type="submit" className="button button-secondary">
            Buscar
          </button>
        </form>
        <div className="ranking-list">
          {ranking.length === 0 ? (
            <p className="form-help">Nenhum jogador encontrado.</p>
          ) : (
            ranking.map((player) => (
              <article
                className={`ranking-row ranking-rank-${Math.min(player.rank, 5)}`}
                key={player.slug}
              >
                <strong className="ranking-position">{player.rank}</strong>
                <div>
                  <a href={`/ranking/${player.slug}`}>{player.name}</a>
                  <span>{player.characterClass}</span>
                </div>
                <span>Nível {player.level}</span>
                <strong>{player.score.toLocaleString('pt-BR')} pts</strong>
              </article>
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}
