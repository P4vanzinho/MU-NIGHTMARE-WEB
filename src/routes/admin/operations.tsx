import { createFileRoute, redirect } from '@tanstack/react-router';
import { getOperationsOverview } from '#/server/operations/operations';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/admin/operations')({
  loader: async () => {
    try {
      return await getOperationsOverview();
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: OperationsPage,
});

function OperationsPage() {
  const { openmu, logs } = Route.useLoaderData();
  return (
    <PageShell>
      <section className="content-section">
        <p className="eyebrow">ADMINISTRAÇÃO · OPERAÇÕES</p>
        <h1>Saúde operacional</h1>
        <article className="account-card">
          <span>OpenMU</span>
          <strong>
            {openmu.mode} · {openmu.connected ? 'conectado' : 'indisponível'}
          </strong>
          <p>{openmu.message}</p>
        </article>
        <h2>Últimas operações</h2>
        <div className="admin-news-list">
          {logs.length === 0 ? (
            <p className="form-help">Nenhuma operação registrada ainda.</p>
          ) : (
            logs.map((log) => (
              <article className="news-card" key={log.id}>
                <span>
                  {log.status} ·{' '}
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </span>
                <h3>{log.operation}</h3>
                <p>{log.detail}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}
