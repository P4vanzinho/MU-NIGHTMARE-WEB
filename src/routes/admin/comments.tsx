import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';

import { getAdminComments, moderateNewsComment } from '#/server/news/news';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/admin/comments')({
  loader: async () => {
    try {
      return await getAdminComments();
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: AdminCommentsPage,
});

function AdminCommentsPage() {
  const comments = Route.useLoaderData();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function moderate(commentId: string, status: 'visible' | 'hidden') {
    const reason = reasons[commentId]?.trim() ?? '';
    if (reason.length < 3) {
      setError('Informe um motivo com pelo menos 3 caracteres.');
      return;
    }
    setError(null);
    try {
      await moderateNewsComment({
        data: { commentId, status, reason },
      });
      window.location.reload();
    } catch (moderationError) {
      setError(
        moderationError instanceof Error
          ? moderationError.message
          : 'Não foi possível moderar o comentário.',
      );
    }
  }

  return (
    <PageShell>
      <section className="content-section">
        <p className="eyebrow">ADMINISTRAÇÃO · MODERAÇÃO</p>
        <h1>Comentários</h1>
        <div className="comment-list admin-comment-list">
          {comments.length === 0 ? (
            <p className="form-help">Nenhum comentário recebido.</p>
          ) : (
            comments.map((comment) => (
              <article className="comment-card" key={comment.id}>
                <div>
                  <strong>{comment.authorName}</strong>
                  <span>{comment.postTitle}</span>
                  <span>
                    {comment.status === 'hidden' ? 'Oculto' : 'Visível'}
                  </span>
                </div>
                <p>{comment.body}</p>
                <label>
                  Motivo da decisão
                  <input
                    value={reasons[comment.id] ?? ''}
                    onChange={(event) =>
                      setReasons((current) => ({
                        ...current,
                        [comment.id]: event.target.value,
                      }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() =>
                    moderate(
                      comment.id,
                      comment.status === 'hidden' ? 'visible' : 'hidden',
                    )
                  }
                >
                  {comment.status === 'hidden' ? 'Restaurar' : 'Ocultar'}
                </button>
              </article>
            ))
          )}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </PageShell>
  );
}
