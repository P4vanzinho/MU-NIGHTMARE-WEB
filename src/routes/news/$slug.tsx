import { createFileRoute, notFound } from '@tanstack/react-router';
import { useState } from 'react';

import { getCurrentSession } from '#/server/auth/session';
import {
  createNewsComment,
  getNewsPost,
  removeNewsComment,
  setNewsLike,
} from '#/server/news/news';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/news/$slug')({
  loader: async ({ params }) => {
    const [post, session] = await Promise.all([
      getNewsPost({ data: { slug: params.slug } }),
      getCurrentSession(),
    ]);
    if (!post) throw notFound();
    return { post, session };
  },
  component: NewsPostPage,
});

function NewsPostPage() {
  const { post, session } = Route.useLoaderData();
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleLike() {
    setError(null);
    try {
      await setNewsLike({
        data: { slug: post.slug, liked: !post.likedByViewer },
      });
      window.location.reload();
    } catch (likeError) {
      setError(
        likeError instanceof Error
          ? likeError.message
          : 'Não foi possível atualizar a curtida.',
      );
    }
  }

  async function handleComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await createNewsComment({ data: { slug: post.slug, body: comment } });
      window.location.reload();
    } catch (commentError) {
      setError(
        commentError instanceof Error
          ? commentError.message
          : 'Não foi possível publicar o comentário.',
      );
      setIsSaving(false);
    }
  }

  async function handleRemoveComment(commentId: string) {
    setError(null);
    try {
      await removeNewsComment({ data: { commentId } });
      window.location.reload();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : 'Não foi possível remover o comentário.',
      );
    }
  }

  return (
    <PageShell>
      <article className="news-post">
        <p className="eyebrow">{post.category}</p>
        <h1>{post.title}</h1>
        <p className="news-post-excerpt">{post.excerpt}</p>
        <div className="news-post-meta">
          <span>Por {post.authorName}</span>
          <time dateTime={post.publishedAt ?? post.createdAt}>
            {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString(
              'pt-BR',
            )}
          </time>
        </div>
        {post.coverImage && (
          <img className="news-post-cover" src={post.coverImage} alt="" />
        )}
        <div className="news-post-content">
          {post.content.split('\n\n').map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <section className="news-interactions" aria-label="Interações">
          <button
            type="button"
            className="button button-secondary"
            onClick={handleLike}
          >
            {post.likedByViewer ? 'Descurtir' : 'Curtir'} · {post.likeCount}
          </button>
          <h2>Comentários</h2>
          {post.comments.length === 0 ? (
            <p className="form-help">Ainda não há comentários.</p>
          ) : (
            <div className="comment-list">
              {post.comments.map((item) => (
                <article className="comment-card" key={item.id}>
                  <div>
                    <strong>{item.authorName}</strong>
                    <time>
                      {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </time>
                  </div>
                  <p>{item.body}</p>
                  {session?.user.id === item.authorId && (
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => handleRemoveComment(item.id)}
                    >
                      Remover
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
          {session ? (
            <form className="comment-form" onSubmit={handleComment}>
              <label>
                Escreva um comentário
                <textarea
                  required
                  maxLength={2_000}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </label>
              <button
                type="submit"
                className="button button-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Publicando...' : 'Comentar'}
              </button>
            </form>
          ) : (
            <p className="form-help">
              <a href="/login">Entre</a> para curtir e comentar.
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </section>
      </article>
    </PageShell>
  );
}
