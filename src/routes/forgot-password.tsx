import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { authClient } from '#/shared/auth/auth-client';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);
    setMessage(
      'Se o endereço estiver cadastrado, as instruções foram capturadas localmente.',
    );
  }

  return (
    <PageShell>
      <section className="form-section">
        <p className="eyebrow">RECUPERAÇÃO</p>
        <h1>Esqueci minha senha</h1>
        <p className="form-intro">
          Informe seu e-mail para receber um link de recuperação.
        </p>
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
          <button
            type="submit"
            className="button button-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar instruções'}
          </button>
        </form>
        {message && (
          <p className="form-success" role="status">
            {message}
          </p>
        )}
        <p className="form-help">
          <a href="/dev/email-outbox">Abrir capturador local</a>
        </p>
      </section>
    </PageShell>
  );
}
