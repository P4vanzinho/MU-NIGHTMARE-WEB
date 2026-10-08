import { createFileRoute, redirect } from '@tanstack/react-router';

import { getRequiredAdminSession } from '#/server/auth/session';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/admin')({
  loader: async () => {
    try {
      return await getRequiredAdminSession();
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const session = Route.useLoaderData();
  return (
    <PageShell>
      <section className="form-section">
        <p className="eyebrow">ADMINISTRAÇÃO</p>
        <h1>Painel</h1>
        <p className="form-intro">
          Acesso administrativo de {session.user.name}.
        </p>
        <div className="account-card">
          <span>Permissão</span>
          <strong>admin</strong>
          <span>Próximos módulos</span>
          <strong>Notícias e reports</strong>
        </div>
      </section>
    </PageShell>
  );
}
