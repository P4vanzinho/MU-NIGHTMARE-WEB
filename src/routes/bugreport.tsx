import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { getCurrentSession } from '#/server/auth/session';
import { createBugReport, getMyBugReports } from '#/server/reports/reports';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/bugreport')({
  loader: async () => {
    const session = await getCurrentSession();
    const reports = session ? await getMyBugReports() : [];
    return { session, reports };
  },
  component: BugReportPage,
});

function BugReportPage() {
  const { session, reports } = Route.useLoaderData();
  const [visibleReports, setVisibleReports] = useState(reports);
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState('');
  const [impact, setImpact] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const report = await createBugReport({
        data: { title, steps, impact },
      });
      setTitle('');
      setSteps('');
      setImpact('');
      setMessage(`Report enviado. Protocolo ${report.protocol}.`);
      setVisibleReports((current) => [report, ...current]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível enviar o report.',
      );
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell>
      <section className="content-section report-page">
        <p className="eyebrow">SUPORTE</p>
        <h1>Reportar um bug</h1>
        {session ? (
          <>
            <p className="form-intro">
              Descreva o problema com detalhes para a equipe conseguir
              reproduzi-lo.
            </p>
            <form className="auth-form report-form" onSubmit={handleSubmit}>
              <label>
                Título
                <input
                  required
                  maxLength={140}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label>
                Passos para reproduzir
                <textarea
                  required
                  maxLength={8_000}
                  value={steps}
                  onChange={(event) => setSteps(event.target.value)}
                />
              </label>
              <label>
                Impacto observado
                <textarea
                  required
                  maxLength={2_000}
                  value={impact}
                  onChange={(event) => setImpact(event.target.value)}
                />
              </label>
              <button
                type="submit"
                className="button button-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar report'}
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
            <h2>Meus reports</h2>
            <div className="report-list">
              {visibleReports.length === 0 ? (
                <p className="form-help">
                  Você ainda não enviou nenhum report.
                </p>
              ) : (
                visibleReports.map((report) => (
                  <article className="report-card" key={report.id}>
                    <div>
                      <strong>{report.title}</strong>
                      <span>{report.protocol}</span>
                    </div>
                    <span>Status: {report.status}</span>
                    <time>
                      {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                    </time>
                  </article>
                ))
              )}
            </div>
          </>
        ) : (
          <p className="form-intro">
            <a className="text-link" href="/login">
              Entre na sua conta
            </a>{' '}
            para enviar e acompanhar reports.
          </p>
        )}
      </section>
    </PageShell>
  );
}
