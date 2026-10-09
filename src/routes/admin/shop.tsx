import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { getAdminShopProducts, upsertShopProduct } from '#/server/shop/shop';
import { PageShell } from '#/shared/layout/page-shell';
export const Route = createFileRoute('/admin/shop')({
  loader: async () => {
    try {
      return await getAdminShopProducts();
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: AdminShopPage,
});
type Form = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  currency: string;
  priceCents: number;
  benefit: string;
  eligibility: string;
  active: boolean;
};
const empty: Form = {
  slug: '',
  name: '',
  description: '',
  currency: 'BRL',
  priceCents: 1000,
  benefit: '',
  eligibility: 'Conta verificada',
  active: true,
};
function AdminShopPage() {
  const products = Route.useLoaderData();
  const [form, setForm] = useState<Form>(empty);
  const [message, setMessage] = useState<string | null>(null);
  const update = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await upsertShopProduct({ data: form });
    setMessage('Produto salvo.');
    window.location.reload();
  }
  return (
    <PageShell>
      <section className="content-section">
        <p className="eyebrow">ADMINISTRAÇÃO · LOJA</p>
        <h1>Catálogo</h1>
        <form className="auth-form news-editor" onSubmit={submit}>
          {(
            [
              'slug',
              'name',
              'description',
              'currency',
              'benefit',
              'eligibility',
            ] as const
          ).map((key) => (
            <label key={key}>
              {key}
              <input
                required
                value={form[key]}
                onChange={(event) => update(key, event.target.value)}
              />
            </label>
          ))}
          <label>
            Preço em centavos
            <input
              type="number"
              min="1"
              value={form.priceCents}
              onChange={(event) =>
                update('priceCents', Number(event.target.value))
              }
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => update('active', event.target.checked)}
            />{' '}
            Ativo
          </label>
          <button className="button button-primary" type="submit">
            Salvar produto
          </button>
        </form>
        {message && (
          <p className="form-success" role="status">
            {message}
          </p>
        )}
        <div className="admin-news-list">
          {products.map((product) => (
            <article className="news-card" key={product.id}>
              <span>{product.active ? 'Ativo' : 'Inativo'}</span>
              <h2>{product.name}</h2>
              <p>{product.benefit}</p>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setForm(product)}
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
