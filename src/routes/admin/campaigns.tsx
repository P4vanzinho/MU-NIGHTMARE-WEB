import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';

import { getAdminCampaigns, upsertCampaign } from '#/server/site/campaigns';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/admin/campaigns')({
  loader: async () => {
    try {
      return await getAdminCampaigns();
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: AdminCampaignsPage,
});

type FormState = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  active: boolean;
  position: number;
};
const emptyForm: FormState = {
  slug: '',
  title: '',
  description: '',
  ctaLabel: '',
  ctaHref: '/',
  active: true,
  position: 0,
};

function AdminCampaignsPage() {
  const campaigns = Route.useLoaderData();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [field]: value }));
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await upsertCampaign({ data: form });
      setMessage('Campanha salva.');
      window.location.reload();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar.',
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <PageShell>
      <section className="content-section admin-news-page">
        <p className="eyebrow">ADMINISTRAÇÃO · HOME</p>
        <h1>Campanhas da home</h1>
        <p className="form-intro">
          Edite os destaques e CTAs exibidos na página inicial. Use apenas rotas
          internas.
        </p>
        <form className="auth-form news-editor" onSubmit={submit}>
          {(
            ['slug', 'title', 'description', 'ctaLabel', 'ctaHref'] as const
          ).map((field) => (
            <label key={field} htmlFor={`campaign-${field}`}>
              {field === 'ctaHref'
                ? 'Rota do CTA'
                : field === 'ctaLabel'
                  ? 'Texto do CTA'
                  : field === 'slug'
                    ? 'Slug'
                    : field === 'title'
                      ? 'Título'
                      : 'Descrição'}
              {field === 'description' ? (
                <textarea
                  id={`campaign-${field}`}
                  required
                  value={form[field]}
                  onChange={(event) => update(field, event.target.value)}
                />
              ) : (
                <input
                  id={`campaign-${field}`}
                  required
                  value={form[field]}
                  onChange={(event) => update(field, event.target.value)}
                />
              )}
            </label>
          ))}
          <label>
            Posição
            <input
              type="number"
              min="0"
              max="99"
              value={form.position}
              onChange={(event) =>
                update('position', Number(event.target.value))
              }
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => update('active', event.target.checked)}
            />{' '}
            Ativa
          </label>
          <button
            className="button button-primary"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Salvando...'
              : form.id
                ? 'Salvar edição'
                : 'Criar campanha'}
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
        <div className="admin-news-list">
          {campaigns.map((campaign) => (
            <article className="news-card" key={campaign.id}>
              <span>
                {campaign.active ? 'Ativa' : 'Inativa'} · posição{' '}
                {campaign.position}
              </span>
              <h2>{campaign.title}</h2>
              <p>{campaign.description}</p>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setForm(campaign)}
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
