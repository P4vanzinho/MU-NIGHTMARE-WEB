import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';

import { getAdminBenefitGrants, retryBenefitGrant } from '#/server/shop/shop';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/admin/grants')({
  loader: async () => {
    try {
      return await getAdminBenefitGrants();
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: AdminGrantsPage,
});

function AdminGrantsPage() {
  const grants = Route.useLoaderData();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function retry(grantId: string) {
    setMessage(null);
    setError(null);
    try {
      await retryBenefitGrant({ data: { grantId } });
      setMessage('Benefício recuperado no simulador.');
      window.location.reload();
    } catch (retryError) {
      setError(
        retryError instanceof Error
          ? retryError.message
          : 'Não foi possível recuperar o benefício.',
      );
    }
  }

  return (
    <PageShell>
      <section className="content-section">
        <p className="eyebrow">ADMINISTRAÇÃO · BENEFÍCIOS</p>
        <h1>Concessões</h1>
        <p className="form-help">
          O ledger local é a autoridade do simulador. Concessões reais do jogo
          só serão habilitadas após o contrato OpenMU.
        </p>
        <div className="search-results">
          {grants.length === 0 ? (
            <p className="form-help">Nenhuma concessão registrada.</p>
          ) : (
            grants.map((grant) => (
              <article className="search-result" key={grant.id}>
                <strong>{grant.benefit}</strong>
                <span>
                  {grant.reference} · {grant.status}
                </span>
                {grant.status !== 'granted' && (
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => retry(grant.id)}
                  >
                    Recuperar
                  </button>
                )}
              </article>
            ))
          )}
        </div>
        {message && (
          <p className="form-success" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </PageShell>
  );
}
