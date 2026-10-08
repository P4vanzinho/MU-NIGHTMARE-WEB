import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';

import { getAdminBugReports, reviewBugReport } from '#/server/reports/reports';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/admin/reports')({
  loader: async () => {
    try {
      return await getAdminBugReports();
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: AdminReportsPage,
});

type ReviewDraft = {
  status: 'in_review' | 'resolved' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  adminNote: string;
  rewardStatus: 'pending' | 'approved' | 'denied';
  rewardReason: string;
};

function AdminReportsPage() {
  const reports = Route.useLoaderData();
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function getDraft(report: (typeof reports)[number]): ReviewDraft {
    return (
      drafts[report.id] ?? {
        status: (report.status === 'submitted'
          ? 'in_review'
          : report.status) as ReviewDraft['status'],
        severity: (report.severity ?? 'medium') as ReviewDraft['severity'],
        adminNote: report.adminNote ?? '',
        rewardStatus: report.rewardStatus as ReviewDraft['rewardStatus'],
        rewardReason: report.rewardReason ?? '',
      }
    );
  }

  function updateDraft(reportId: string, patch: Partial<ReviewDraft>) {
    const report = reports.find((item) => item.id === reportId);
    if (!report) return;
    setDrafts((current) => ({
      ...current,
      [reportId]: { ...getDraft(report), ...patch },
    }));
  }

  async function saveReview(reportId: string) {
    const report = reports.find((item) => item.id === reportId);
    if (!report) return;
    const draft = getDraft(report);
    if (
      draft.adminNote.trim().length < 3 ||
      draft.rewardReason.trim().length < 3
    ) {
      setError('Preencha a análise e a justificativa da recompensa.');
      return;
    }
    setPendingId(reportId);
    setError(null);
    setMessage(null);
    try {
      await reviewBugReport({ data: { reportId, ...draft } });
      setMessage(`Report ${report.protocol} analisado.`);
      window.location.reload();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Não foi possível salvar a análise.',
      );
      setPendingId(null);
    }
  }

  return (
    <PageShell>
      <section className="content-section admin-reports-page">
        <p className="eyebrow">ADMINISTRAÇÃO · REPORTS</p>
        <h1>Analisar reports</h1>
        <p className="form-intro">
          Registre a análise e a decisão de recompensa. A entrega de qualquer
          benefício será implementada em uma fase posterior.
        </p>
        <div className="admin-report-list">
          {reports.length === 0 ? (
            <p className="form-help">Nenhum report recebido.</p>
          ) : (
            reports.map((report) => {
              const draft = getDraft(report);
              return (
                <article
                  className="report-card admin-report-card"
                  key={report.id}
                >
                  <div>
                    <strong>{report.title}</strong>
                    <span>
                      {report.protocol} · {report.reporterName}
                    </span>
                    <span>{report.reporterEmail}</span>
                  </div>
                  <p>
                    <strong>Passos:</strong> {report.steps}
                  </p>
                  <p>
                    <strong>Impacto:</strong> {report.impact}
                  </p>
                  <div className="review-grid">
                    <label>
                      Status
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          updateDraft(report.id, {
                            status: event.target.value as ReviewDraft['status'],
                          })
                        }
                      >
                        <option value="in_review">Em análise</option>
                        <option value="resolved">Resolvido</option>
                        <option value="closed">Encerrado</option>
                      </select>
                    </label>
                    <label>
                      Severidade
                      <select
                        value={draft.severity}
                        onChange={(event) =>
                          updateDraft(report.id, {
                            severity: event.target
                              .value as ReviewDraft['severity'],
                          })
                        }
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                        <option value="critical">Crítica</option>
                      </select>
                    </label>
                    <label>
                      Recompensa
                      <select
                        value={draft.rewardStatus}
                        onChange={(event) =>
                          updateDraft(report.id, {
                            rewardStatus: event.target
                              .value as ReviewDraft['rewardStatus'],
                          })
                        }
                      >
                        <option value="pending">Pendente</option>
                        <option value="approved">Aprovada</option>
                        <option value="denied">Recusada</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    Análise administrativa
                    <textarea
                      value={draft.adminNote}
                      onChange={(event) =>
                        updateDraft(report.id, {
                          adminNote: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Justificativa da recompensa
                    <textarea
                      value={draft.rewardReason}
                      onChange={(event) =>
                        updateDraft(report.id, {
                          rewardReason: event.target.value,
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="button button-primary"
                    disabled={pendingId === report.id}
                    onClick={() => saveReview(report.id)}
                  >
                    {pendingId === report.id ? 'Salvando...' : 'Salvar análise'}
                  </button>
                </article>
              );
            })
          )}
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
    </PageShell>
  );
}
