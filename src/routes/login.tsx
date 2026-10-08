import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { authClient } from '#/shared/auth/auth-client';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/login')({ component: LoginPage });

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: 'http://localhost:3000/account',
    });
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? 'Não foi possível entrar.');
      return;
    }
    window.location.assign('/account');
  }

  return (
    <PageShell>
      <section className="form-section">
        <p className="eyebrow">ACESSO</p>
        <h1>Entrar</h1>
        <p className="form-intro">Acesse sua conta de jogador.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            E-mail
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="button button-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <p className="form-help">
          Ainda não tem conta? <a href="/register">Criar conta</a>
        </p>
      </section>
    </PageShell>
  );
}
