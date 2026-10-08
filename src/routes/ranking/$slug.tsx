import { createFileRoute, notFound } from '@tanstack/react-router';

import { getPublicPlayerProfile } from '#/server/ranking/ranking';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/ranking/$slug')({
  loader: async ({ params }) => {
    const profile = await getPublicPlayerProfile({
      data: { slug: params.slug },
    });
    if (!profile) throw notFound();
    return profile;
  },
  component: RankingProfilePage,
});

function RankingProfilePage() {
  const profile = Route.useLoaderData();
  return (
    <PageShell>
      <section className="content-section profile-page">
        <p className="eyebrow">PERFIL PÚBLICO</p>
        <h1>{profile.name}</h1>
        <p className="form-intro">
          Informações públicas do ranking simulado do servidor.
        </p>
        <div className="profile-stats">
          <div className="stat-card">
            <span>Posição</span>
            <strong>#{profile.rank}</strong>
          </div>
          <div className="stat-card">
            <span>Classe</span>
            <strong>{profile.characterClass}</strong>
          </div>
          <div className="stat-card">
            <span>Nível</span>
            <strong>{profile.level}</strong>
          </div>
          <div className="stat-card">
            <span>Pontuação</span>
            <strong>{profile.score.toLocaleString('pt-BR')}</strong>
          </div>
        </div>
        <a className="text-link" href="/ranking">
          Voltar para o ranking
        </a>
      </section>
    </PageShell>
  );
}
