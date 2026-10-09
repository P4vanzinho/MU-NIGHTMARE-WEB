import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { getCurrentSession } from '#/server/auth/session';
import {
  createSimulatedOrder,
  getMyOrders,
  getShopProducts,
  simulatePaymentEvent,
} from '#/server/shop/shop';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/shop')({
  loader: async () => {
    const session = await getCurrentSession();
    if (!session) throw redirect({ to: '/login' });
    const [products, orders] = await Promise.all([
      getShopProducts(),
      getMyOrders(),
    ]);
    return { products, orders };
  },
  component: ShopPage,
});
function ShopPage() {
  const { products, orders } = Route.useLoaderData();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function buy(productId: string) {
    setMessage(null);
    setError(null);
    try {
      const order = await createSimulatedOrder({ data: { productId } });
      const result = await simulatePaymentEvent({
        data: {
          orderProtocol: order.protocol,
          eventId: `evt-${crypto.randomUUID()}`,
          status: 'confirmed',
        },
      });
      setMessage(
        `Pedido ${order.protocol} confirmado no simulador (${result.status}).`,
      );
    } catch (buyError) {
      setError(
        buyError instanceof Error
          ? buyError.message
          : 'Não foi possível criar o pedido.',
      );
    }
  }
  return (
    <PageShell>
      <section className="content-section">
        <p className="eyebrow">LOJA · SIMULADOR</p>
        <h1>Ofertas Nightmare</h1>
        <p className="form-intro">
          Preços e benefícios abaixo são locais e não representam cobrança real.
        </p>
        <div className="campaign-grid">
          {products.map((product) => (
            <article className="campaign-card" key={product.id}>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <strong>
                {(product.priceCents / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: product.currency,
                })}
              </strong>
              <span>
                {product.benefit} · {product.eligibility}
              </span>
              <button
                type="button"
                className="button button-primary"
                onClick={() => buy(product.id)}
              >
                Criar pedido simulado
              </button>
            </article>
          ))}
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
        <h2>Meus pedidos</h2>
        <div className="search-results">
          {orders.length === 0 ? (
            <p className="form-help">Nenhum pedido criado.</p>
          ) : (
            orders.map((order) => (
              <div className="search-result" key={order.protocol}>
                <strong>{order.productName}</strong>
                <span>
                  {order.protocol} · {order.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}
