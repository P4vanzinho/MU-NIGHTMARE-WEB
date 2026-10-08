import { createFileRoute } from '@tanstack/react-router';

import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  return (
    <PageShell>
      <section className="form-section">
        <p className="eyebrow">CONFIRMAÇÃO</p>
        <h1>Endereço confirmado</h1>
        <p className="form-intro">
          Seu endereço foi processado. Você já pode continuar no portal.
        </p>
        <a className="button button-primary" href="/">
          Voltar ao início
        </a>
      </section>
    </PageShell>
  );
}
