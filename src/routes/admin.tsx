import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import {
  getAdminAccounts,
  updateAdminAccountStatus,
} from '#/server/admin/accounts';
import { getRequiredAdminSession } from '#/server/auth/session';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/admin')({
  loader: async () => {
    try {
      const [session, accounts] = await Promise.all([
        getRequiredAdminSession(),
        getAdminAccounts(),
      ]);
      return { session, accounts };
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const { session, accounts } = Route.useLoaderData();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleStatusChange(
    accountId: string,
    action: 'ban' | 'unban',
  ) {
    const reason = reasons[accountId]?.trim() ?? '';
    if (reason.length < 3) {
      setError('Informe um motivo com pelo menos 3 caracteres.');
      return;
    }
    setPendingId(accountId);
    setMessage(null);
    setError(null);
    try {
      await updateAdminAccountStatus({
        data: { userId: accountId, action, reason },
      });
      setMessage(action === 'ban' ? 'Conta bloqueada.' : 'Conta desbloqueada.');
      window.location.reload();
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : 'Não foi possível atualizar a conta.',
      );
    } finally {
      setPendingId(null);
    }
  }

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
        <a className="button button-primary" href="/admin/news">
          Gerenciar notícias
        </a>
        <a className="button button-secondary" href="/admin/comments">
          Moderar comentários
        </a>
        <a className="button button-secondary" href="/admin/reports">
          Analisar reports
        </a>
        <a className="button button-secondary" href="/admin/campaigns">
          Editar campanhas da home
        </a>
        <a className="button button-secondary" href="/admin/operations">
          Saúde operacional
        </a>
        <a className="button button-secondary" href="/admin/shop">
          Gerenciar catálogo
        </a>
        <h2>Contas do portal</h2>
        <p className="form-help">
          Bloqueios afetam somente o acesso ao portal e encerram as sessões da
          conta. Eles não banem o jogador no OpenMU.
        </p>
        <div className="admin-account-list">
          {accounts.map((account) => {
            const isPending = pendingId === account.id;
            return (
              <article
                className="account-card admin-account-card"
                key={account.id}
              >
                <div>
                  <strong>{account.name}</strong>
                  <span>{account.email}</span>
                  <span>
                    {account.role} · {account.banned ? 'bloqueada' : 'ativa'}
                  </span>
                  {account.banned && account.banReason && (
                    <span>Motivo: {account.banReason}</span>
                  )}
                </div>
                <label>
                  Motivo da decisão
                  <input
                    value={reasons[account.id] ?? ''}
                    onChange={(event) =>
                      setReasons((current) => ({
                        ...current,
                        [account.id]: event.target.value,
                      }))
                    }
                    placeholder="Ex.: comportamento abusivo"
                  />
                </label>
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={isPending || account.id === session.user.id}
                  onClick={() =>
                    handleStatusChange(
                      account.id,
                      account.banned ? 'unban' : 'ban',
                    )
                  }
                >
                  {isPending
                    ? 'Salvando...'
                    : account.banned
                      ? 'Desbloquear'
                      : 'Bloquear'}
                </button>
              </article>
            );
          })}
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
      <Outlet />
    </PageShell>
  );
}
