import { createFileRoute, redirect } from '@tanstack/react-router';

import { getCurrentSession } from '#/server/auth/session';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/account')({
  loader: async () => {
    const session = await getCurrentSession();
    if (!session) throw redirect({ to: '/login' });
    return session;
  },
  component: AccountPage,
});

function AccountPage() {
  const session = Route.useLoaderData();
  async function handleLogout() {
    try {
      await fetch('/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });
    } finally {
      window.location.assign('/');
    }
  }
  return (
    <PageShell>
      <section className="form-section">
        <p className="eyebrow">CONTA</p>
        <h1>Olá, {session.user.name}</h1>
        <p className="form-intro">Sua conta de jogador está ativa.</p>
        <div className="account-card">
          <span>E-mail</span>
          <strong>{session.user.email}</strong>
          <span>Perfil</span>
          <strong>{session.user.role ?? 'player'}</strong>
        </div>
        <button
          type="button"
          className="button button-secondary"
          onClick={handleLogout}
        >
          Sair
        </button>
      </section>
    </PageShell>
  );
}
