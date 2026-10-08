import { createFileRoute } from '@tanstack/react-router';
import { readOpenMuHealth } from '#/server/integrations/openmu/health';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/server')({
  loader: () => readOpenMuHealth(),
  component: ServerPage,
});

function ServerPage() {
  const health = Route.useLoaderData();
  return (
    <PageShell>
      <section className="content-section server-page">
        <p className="eyebrow">INTEGRAÇÃO</p>
        <h1>Servidor</h1>
        <article className="account-card">
          <span>Modo</span>
          <strong>{health.mode === 'simulated' ? 'Simulado' : 'Real'}</strong>
          <span>Status</span>
          <strong>
            {health.connected ? 'Disponível' : 'Aguardando configuração'}
          </strong>
          <p>{health.message}</p>
        </article>
        <h2>Capacidades públicas</h2>
        <div className="stat-grid">
          {health.capabilities.map((capability) => (
            <div className="stat-card" key={capability}>
              <strong>{capability}</strong>
              <span>Contrato preparado</span>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
