import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { authClient } from '#/shared/auth/auth-client';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/register')({ component: RegisterPage });

function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    terms: false,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!form.terms) {
      setError('Aceite os termos para continuar.');
      return;
    }
    setIsSubmitting(true);
    const result = await authClient.signUp.email({
      name: form.name,
      email: form.email,
      password: form.password,
      callbackURL: 'http://localhost:3000/verify-email',
    });
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? 'Não foi possível criar a conta.');
      return;
    }
    setMessage(
      'Conta criada. Verifique o e-mail capturado localmente para confirmar seu endereço.',
    );
  }

  return (
    <PageShell>
      <section className="form-section">
        <p className="eyebrow">JUNTE-SE AO NIGHTMARE</p>
        <h1>Criar conta</h1>
        <p className="form-intro">Cadastre seu acesso de jogador.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Nome de jogador
            <input
              required
              minLength={3}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </label>
          <label>
            E-mail
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
          </label>
          <label>
            Senha
            <input
              required
              minLength={8}
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(event) =>
                setForm({ ...form, terms: event.target.checked })
              }
            />{' '}
            Aceito os termos do servidor
          </label>
          <button
            type="submit"
            className="button button-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Criando...' : 'Criar conta'}
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
          Já possui uma conta? <a href="/login">Entrar</a>
        </p>
        <p className="form-help">
          <a href="/dev/email-outbox">Abrir capturador de e-mail local</a>
        </p>
      </section>
    </PageShell>
  );
}
