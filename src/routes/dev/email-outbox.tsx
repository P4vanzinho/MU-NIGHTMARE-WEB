import { createFileRoute } from '@tanstack/react-router';

import { getEmailOutbox } from '#/server/auth/get-email-outbox';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/dev/email-outbox')({
  loader: () => getEmailOutbox(),
  component: EmailOutboxPage,
});

function EmailOutboxPage() {
  const emails = Route.useLoaderData();
  return (
    <PageShell>
      <section className="content-section">
        <p className="eyebrow">DESENVOLVIMENTO LOCAL</p>
        <h1>Capturador de e-mail</h1>
        <p className="form-intro">
          Mensagens de confirmação ficam disponíveis somente no ambiente local.
        </p>
        <div className="outbox-list">
          {emails.length === 0 ? (
            <p>Nenhum e-mail capturado.</p>
          ) : (
            emails.map((email) => (
              <article
                className="outbox-card"
                key={`${email.email}-${email.sentAt}`}
              >
                <strong>
                  {email.type === 'password-reset'
                    ? 'Recuperação de senha'
                    : 'Confirmação de e-mail'}{' '}
                  · {email.email}
                </strong>
                <time>{new Date(email.sentAt).toLocaleString('pt-BR')}</time>
                <a href={email.url}>Confirmar endereço</a>
                <code>{email.url}</code>
              </article>
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}
