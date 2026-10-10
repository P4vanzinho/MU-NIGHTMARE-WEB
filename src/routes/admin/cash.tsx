import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';

import {
  expireCashReservations,
  getAdminCashDisputes,
  getAdminCashOrders,
  getAdminCashPayouts,
  releaseCashOrder,
  resolveCashDispute,
  settleCashPayout,
  simulateCashDelivery,
} from '#/server/marketplace/cash';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/admin/cash')({
  loader: async () => {
    try {
      const [orders, disputes, payouts] = await Promise.all([
        getAdminCashOrders(),
        getAdminCashDisputes(),
        getAdminCashPayouts(),
      ]);
      return { orders, disputes, payouts };
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: AdminCashPage,
});

function AdminCashPage() {
  const { orders, disputes, payouts } = Route.useLoaderData();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>, success: string) {
    setError(null);
    try {
      await action();
      setMessage(success);
      window.location.reload();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : 'Operação falhou.',
      );
    }
  }

  return (
    <PageShell>
      <section className="content-section">
        <p className="eyebrow">ADMINISTRAÇÃO · ESCROW LOCAL</p>
        <h1>Marketplace em reais</h1>
        <p className="form-help">
          Estas ações simulam confirmação OpenMU, encerramento da contestação e
          liquidação do provedor.
        </p>
        <div className="search-results">
          {orders.map((order) => (
            <article className="search-result" key={order.id}>
              <strong>{order.id}</strong>
              <span>
                R$ {(order.grossCents / 100).toFixed(2)} · {order.status}
              </span>
              {order.status === 'delivery_pending' && (
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() =>
                    run(
                      () =>
                        simulateCashDelivery({ data: { orderId: order.id } }),
                      'Entrega confirmada.',
                    )
                  }
                >
                  Confirmar entrega simulada
                </button>
              )}
              {order.status === 'delivered' && (
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() =>
                    run(
                      () =>
                        releaseCashOrder({
                          data: { orderId: order.id, force: true },
                        }),
                      'Contestação encerrada e saldo liberado.',
                    )
                  }
                >
                  Liberar após contestação
                </button>
              )}
            </article>
          ))}
        </div>
        <button
          className="button button-secondary"
          type="button"
          onClick={() =>
            run(
              () => expireCashReservations(),
              'Reservas expiradas foram processadas.',
            )
          }
        >
          Processar reservas expiradas
        </button>
        <h2>Saques</h2>
        <div className="search-results">
          {payouts.length === 0 ? (
            <p className="form-help">Nenhum saque registrado.</p>
          ) : (
            payouts.map((payout) => (
              <article className="search-result" key={payout.id}>
                <strong>R$ {(payout.amountCents / 100).toFixed(2)}</strong>
                <span>{payout.status}</span>
                {payout.status === 'requested' && (
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={() =>
                      run(
                        () =>
                          settleCashPayout({ data: { payoutId: payout.id } }),
                        'Saque liquidado no simulador.',
                      )
                    }
                  >
                    Liquidar saque simulado
                  </button>
                )}
              </article>
            ))
          )}
        </div>
        <h2>Disputas</h2>
        <div className="search-results">
          {disputes.length === 0 ? (
            <p className="form-help">Nenhuma disputa aberta.</p>
          ) : (
            disputes.map((dispute) => (
              <article className="search-result" key={dispute.id}>
                <strong>{dispute.reason}</strong>
                <span>{dispute.status}</span>
                {dispute.status === 'open' && (
                  <>
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() =>
                        run(
                          () =>
                            resolveCashDispute({
                              data: {
                                disputeId: dispute.id,
                                outcome: 'refund',
                              },
                            }),
                          'Disputa reembolsada.',
                        )
                      }
                    >
                      Reembolsar
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() =>
                        run(
                          () =>
                            resolveCashDispute({
                              data: {
                                disputeId: dispute.id,
                                outcome: 'reject',
                              },
                            }),
                          'Disputa recusada.',
                        )
                      }
                    >
                      Recusar
                    </button>
                  </>
                )}
              </article>
            ))
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
