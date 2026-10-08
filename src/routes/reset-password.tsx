import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { authClient } from '#/shared/auth/auth-client';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token'));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError('O link de recuperação está incompleto.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsSubmitting(true);
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? 'O link expirou ou já foi usado.');
      return;
    }
    setMessage('Senha alterada. As sessões anteriores foram encerradas.');
  }

  return (
    <PageShell>
      <section className="form-section">
        <p className="eyebrow">RECUPERAÇÃO</p>
        <h1>Definir nova senha</h1>
        <p className="form-intro">Escolha uma nova senha para sua conta.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Nova senha
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label>
            Confirmar senha
            <input
              required
              minLength={8}
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="button button-primary"
            disabled={isSubmitting || !token}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
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
        <p className="form-help">
          <a href="/login">Voltar para entrar</a>
        </p>
      </section>
    </PageShell>
  );
}
