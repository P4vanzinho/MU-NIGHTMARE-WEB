import { createFileRoute } from '@tanstack/react-router';

import { getPortalSnapshot } from '#/server/site/get-portal-snapshot';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/')({
  loader: () => getPortalSnapshot(),
  component: HomePage,
});

function HomePage() {
  const snapshot = Route.useLoaderData();
  return (
    <PageShell>
      <section className="hero">
        <div>
          <p className="eyebrow">MU NIGHTMARE</p>
          <h1>O servidor não espera.</h1>
          <p className="hero-copy">
            Entre no mundo de Nightmare, acompanhe o servidor e prepare sua
            próxima jornada.
          </p>
          <a className="button button-primary" href="/download">
            Começar a jogar
          </a>
        </div>
        <section className="server-card" aria-label="Status do servidor">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>{snapshot.server.name}</strong>
            <span>{snapshot.server.statusLabel}</span>
          </div>
          <b>{snapshot.server.onlinePlayers} online</b>
        </section>
      </section>
      <section className="content-section campaign-grid" aria-label="Destaques">
        {snapshot.campaigns.map((campaign) => (
          <article className="campaign-card" key={campaign.id}>
            <p className="eyebrow">NIGHTMARE</p>
            <h2>{campaign.title}</h2>
            <p>{campaign.description}</p>
            <a className="button button-secondary" href={campaign.ctaHref}>
              {campaign.ctaLabel}
            </a>
          </article>
        ))}
      </section>
      <section className="content-section" aria-labelledby="server-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">AGORA</p>
            <h2 id="server-heading">Nightmare em tempo real</h2>
          </div>
          <span className="updated-at">
            Atualizado {formatUpdatedAt(snapshot.updatedAt)}
          </span>
        </div>
        <div className="stat-grid">
          <StatCard
            label="Jogadores online"
            value={snapshot.server.onlinePlayers.toString()}
          />
          <StatCard
            label="Experiência"
            value={`${snapshot.server.experienceRate}x`}
          />
          <StatCard label="Drop" value={`${snapshot.server.dropRate}%`} />
        </div>
      </section>
      <section
        className="content-section news-section"
        aria-labelledby="news-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">NOTÍCIAS</p>
            <h2 id="news-heading">Últimas do servidor</h2>
          </div>
          <a className="text-link" href="/news">
            Ver notícias
          </a>
        </div>
        <div className="news-grid">
          {snapshot.news.map((post) => (
            <article className="news-card" key={post.id}>
              <span>{post.category}</span>
              <h3>{post.title}</h3>
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}
function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(
    new Date(value),
  );
}
