import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';

import { getCurrentSession } from '#/server/auth/session';
import { getMyGameProfile } from '#/server/game-profile/profile';
import { authClient } from '#/shared/auth/auth-client';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/account')({
  loader: async () => {
    const session = await getCurrentSession();
    if (!session) throw redirect({ to: '/login' });
    const gameProfile = await getMyGameProfile();
    return { session, gameProfile };
  },
  component: AccountPage,
});

function AccountPage() {
  const { session, gameProfile } = Route.useLoaderData();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
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
  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);
    setIsChangingPassword(true);
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setIsChangingPassword(false);
    if (result.error) {
      setPasswordError(
        result.error.message ?? 'Não foi possível alterar a senha.',
      );
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setPasswordMessage('Senha alterada. As outras sessões foram encerradas.');
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
        <form
          className="auth-form account-password-form"
          onSubmit={handleChangePassword}
        >
          <h2>Alterar senha</h2>
          <label>
            Senha atual
            <input
              required
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <label>
            Nova senha
            <input
              required
              minLength={8}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="button button-secondary"
            disabled={isChangingPassword}
          >
            {isChangingPassword ? 'Salvando...' : 'Alterar senha'}
          </button>
          {passwordMessage && (
            <p className="form-success" role="status">
              {passwordMessage}
            </p>
          )}
          {passwordError && (
            <p className="form-error" role="alert">
              {passwordError}
            </p>
          )}
        </form>
        <section
          className="account-game-section"
          aria-labelledby="characters-heading"
        >
          <h2 id="characters-heading">Personagens</h2>
          <div className="character-list">
            {gameProfile.characters.map((character) => (
              <article className="character-card" key={character.id}>
                <strong>{character.name}</strong>
                <span>{character.characterClass}</span>
                <span>Nível {character.level}</span>
              </article>
            ))}
          </div>
        </section>
        <section
          className="account-game-section"
          aria-labelledby="wallet-heading"
        >
          <h2 id="wallet-heading">Saldos e cofres</h2>
          <div className="stat-grid account-stat-grid">
            <div className="stat-card">
              <span>Nightmare Coins</span>
              <strong>{gameProfile.wallet.nightmareCoins}</strong>
            </div>
            <div className="stat-card">
              <span>VIP</span>
              <strong>{gameProfile.wallet.vipLevel}</strong>
            </div>
          </div>
          <div className="vault-list">
            {gameProfile.vault.map((item) => (
              <div className="vault-item" key={item.id}>
                <span>{item.itemName}</span>
                <strong>x{item.quantity}</strong>
              </div>
            ))}
          </div>
          <p className="form-help">
            Consulta somente leitura. Transferências e débitos ainda não estão
            disponíveis.
          </p>
        </section>
      </section>
    </PageShell>
  );
}
