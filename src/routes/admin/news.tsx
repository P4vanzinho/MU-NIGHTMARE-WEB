import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';

import {
  createNewsPost,
  getAdminNews,
  updateNewsPost,
} from '#/server/news/news';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/admin/news')({
  loader: async () => {
    try {
      return await getAdminNews();
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: AdminNewsPage,
});

type FormState = {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string;
  publish: boolean;
};

const emptyForm: FormState = {
  title: '',
  excerpt: '',
  content: '',
  category: 'Servidor',
  coverImage: '',
  publish: true,
};

function AdminNewsPage() {
  const posts = Route.useLoaderData();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function editPost(post: (typeof posts)[number]) {
    setForm({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      coverImage: post.coverImage ?? '',
      publish: Boolean(post.publishedAt),
    });
    setMessage('Para editar o texto completo, carregue a postagem no editor.');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (form.id) {
        await updateNewsPost({ data: { ...form, id: form.id } });
      } else {
        await createNewsPost({ data: form });
      }
      setMessage(form.id ? 'Notícia atualizada.' : 'Notícia publicada.');
      setForm(emptyForm);
      window.location.reload();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar a notícia.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageShell>
      <section className="content-section admin-news-page">
        <p className="eyebrow">ADMINISTRAÇÃO · NOTÍCIAS</p>
        <h1>Publicar notícia</h1>
        <form className="auth-form news-editor" onSubmit={handleSubmit}>
          <label>
            Título
            <input
              required
              maxLength={140}
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
            />
          </label>
          <label>
            Resumo
            <textarea
              required
              maxLength={280}
              value={form.excerpt}
              onChange={(event) => updateField('excerpt', event.target.value)}
            />
          </label>
          <label>
            Conteúdo
            <textarea
              required
              value={form.content}
              onChange={(event) => updateField('content', event.target.value)}
            />
          </label>
          <label>
            Categoria
            <input
              required
              value={form.category}
              onChange={(event) => updateField('category', event.target.value)}
            />
          </label>
          <label>
            URL da capa (opcional)
            <input
              type="url"
              value={form.coverImage}
              onChange={(event) =>
                updateField('coverImage', event.target.value)
              }
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.publish}
              onChange={(event) => updateField('publish', event.target.checked)}
            />
            Publicar agora
          </label>
          <div>
            <button
              type="submit"
              className="button button-primary"
              disabled={isSaving}
            >
              {isSaving
                ? 'Salvando...'
                : form.id
                  ? 'Salvar edição'
                  : 'Publicar'}
            </button>
            {form.id && (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setForm(emptyForm)}
              >
                Cancelar edição
              </button>
            )}
          </div>
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
        <h2>Publicações</h2>
        <div className="admin-news-list">
          {posts.map((post) => (
            <article className="news-card" key={post.id}>
              <span>{post.category}</span>
              <h3>{post.title}</h3>
              <span>{post.publishedAt ? 'Publicada' : 'Rascunho'}</span>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => editPost(post)}
              >
                Editar
              </button>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
