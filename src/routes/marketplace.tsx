import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { getCurrentSession } from '#/server/auth/session';
import { getMyGameProfile } from '#/server/game-profile/profile';
import {
  connectSimulatedPaymentAccount,
  createCashListing,
  getCashListings,
  getMyCashOrders,
  getMyCashPayouts,
  getSellerCashBalance,
  getSellerPaymentAccount,
  initiateCashOrder,
  requestCashPayout,
  simulateCashPayment,
} from '#/server/marketplace/cash';
import {
  acceptMarketplaceOffer,
  buyMarketplaceListing,
  cancelMarketplaceListing,
  createMarketplaceListing,
  createMarketplaceOffer,
  getMarketplaceListings,
  getMarketplaceOffersForSeller,
  getMyMarketplaceListings,
} from '#/server/marketplace/marketplace';
import { PageShell } from '#/shared/layout/page-shell';

export const Route = createFileRoute('/marketplace')({
  loader: async () => {
    const [session, market, cashListings] = await Promise.all([
      getCurrentSession(),
      getMarketplaceListings({ data: { page: 1 } }),
      getCashListings(),
    ]);
    if (!session)
      return {
        session: null,
        market,
        cashListings,
        profile: null,
        mine: [],
        offers: [],
        cashAccount: null,
        cashOrders: [],
        cashBalance: null,
        cashPayouts: [],
      };
    const [
      profile,
      mine,
      offers,
      cashAccount,
      cashOrders,
      cashBalance,
      cashPayouts,
    ] = await Promise.all([
      getMyGameProfile(),
      getMyMarketplaceListings(),
      getMarketplaceOffersForSeller(),
      getSellerPaymentAccount(),
      getMyCashOrders(),
      getSellerCashBalance(),
      getMyCashPayouts(),
    ]);
    return {
      session,
      market,
      cashListings,
      profile,
      mine,
      offers,
      cashAccount,
      cashOrders,
      cashBalance,
      cashPayouts,
    };
  },
  component: MarketplacePage,
});

function MarketplacePage() {
  const initial = Route.useLoaderData();
  const [market, setMarket] = useState(initial.market);
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [cashItem, setCashItem] = useState('');
  const [cashPrice, setCashPrice] = useState('');
  const [offerAmounts, setOfferAmounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search(event?: React.FormEvent) {
    event?.preventDefault();
    const result = await getMarketplaceListings({
      data: {
        query,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        page: 1,
      },
    });
    setMarket(result);
  }

  async function announce(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await createMarketplaceListing({
        data: { itemId: selectedItem, price: Number(listingPrice) },
      });
      setMessage('Anúncio criado. O item ficou reservado no marketplace.');
    } catch (listingError) {
      setError(
        listingError instanceof Error
          ? listingError.message
          : 'Não foi possível criar o anúncio.',
      );
    }
  }

  async function connectPayment() {
    setError(null);
    try {
      await connectSimulatedPaymentAccount();
      setMessage('Conta Mercado Pago simulada conectada.');
      window.location.reload();
    } catch (connectError) {
      setError(
        connectError instanceof Error
          ? connectError.message
          : 'Não foi possível conectar a conta.',
      );
    }
  }

  async function announceCash(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await createCashListing({
        data: { itemId: cashItem, priceCents: Number(cashPrice) },
      });
      setMessage('Anúncio em reais criado.');
      window.location.reload();
    } catch (cashError) {
      setError(
        cashError instanceof Error
          ? cashError.message
          : 'Não foi possível criar o anúncio em reais.',
      );
    }
  }

  async function buyCash(listingId: string) {
    setError(null);
    try {
      const order = await initiateCashOrder({ data: { listingId } });
      await simulateCashPayment({
        data: {
          orderId: order.id,
          eventId: `cash-${crypto.randomUUID()}`,
          status: 'confirmed',
        },
      });
      setMessage('Pagamento reservado; aguardando entrega simulada.');
      window.location.reload();
    } catch (cashError) {
      setError(
        cashError instanceof Error
          ? cashError.message
          : 'Não foi possível iniciar o pagamento.',
      );
    }
  }

  async function requestPayout(payoutId: string) {
    setError(null);
    try {
      await requestCashPayout({ data: { payoutId } });
      setMessage('Saque solicitado no simulador.');
      window.location.reload();
    } catch (payoutError) {
      setError(
        payoutError instanceof Error
          ? payoutError.message
          : 'Não foi possível solicitar o saque.',
      );
    }
  }

  async function cancel(listingId: string) {
    setError(null);
    try {
      await cancelMarketplaceListing({ data: { listingId } });
      setMessage('Anúncio cancelado e item devolvido ao cofre.');
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : 'Não foi possível cancelar o anúncio.',
      );
    }
  }

  async function buy(listingId: string) {
    setError(null);
    try {
      await buyMarketplaceListing({ data: { listingId } });
      setMessage('Compra concluída no simulador.');
    } catch (buyError) {
      setError(
        buyError instanceof Error
          ? buyError.message
          : 'Não foi possível concluir a compra.',
      );
    }
  }

  async function offer(listingId: string) {
    setError(null);
    try {
      await createMarketplaceOffer({
        data: { listingId, amount: Number(offerAmounts[listingId]) },
      });
      setMessage('Oferta enviada ao vendedor.');
      setOfferAmounts((current) => ({ ...current, [listingId]: '' }));
    } catch (offerError) {
      setError(
        offerError instanceof Error
          ? offerError.message
          : 'Não foi possível enviar a oferta.',
      );
    }
  }

  async function accept(offerId: string) {
    setError(null);
    try {
      await acceptMarketplaceOffer({ data: { offerId } });
      setMessage('Oferta aceita e troca concluída no simulador.');
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : 'Não foi possível aceitar a oferta.',
      );
    }
  }

  return (
    <PageShell>
      <section className="content-section">
        <p className="eyebrow">MARKETPLACE · SIMULADOR</p>
        <h1>Mercado</h1>
        <p className="form-help">
          Anúncios usam Nightmare Coins simulados. Nenhuma moeda real ou
          operação OpenMU é movimentada.
        </p>
        <form className="ranking-search" onSubmit={search}>
          <label>
            Item
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            NC mínimo
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
            />
          </label>
          <label>
            NC máximo
            <input
              type="number"
              min="1"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </label>
          <button className="button button-secondary" type="submit">
            Filtrar
          </button>
        </form>
        <div className="campaign-grid">
          {market.items.length === 0 ? (
            <p className="form-help">Nenhum anúncio encontrado.</p>
          ) : (
            market.items.map((listing) => (
              <article className="campaign-card" key={listing.id}>
                <span>{listing.sellerName}</span>
                <h2>{listing.itemName}</h2>
                <strong>
                  {listing.price.toLocaleString('pt-BR')} {listing.currency}
                </strong>
                {initial.session &&
                  listing.sellerId !== initial.session.user.id && (
                    <>
                      <button
                        className="button button-primary"
                        type="button"
                        onClick={() => buy(listing.id)}
                      >
                        Comprar
                      </button>
                      <label>
                        Oferta em NC
                        <input
                          type="number"
                          min="1"
                          value={offerAmounts[listing.id] ?? ''}
                          onChange={(event) =>
                            setOfferAmounts((current) => ({
                              ...current,
                              [listing.id]: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => offer(listing.id)}
                      >
                        Enviar oferta
                      </button>
                    </>
                  )}
              </article>
            ))
          )}
        </div>
        {initial.session && initial.profile && (
          <>
            <section className="form-section">
              <h2>Anunciar item</h2>
              <form className="auth-form" onSubmit={announce}>
                <label>
                  Item do cofre
                  <select
                    required
                    value={selectedItem}
                    onChange={(event) => setSelectedItem(event.target.value)}
                  >
                    <option value="">Selecione</option>
                    {initial.profile.vault.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.itemName} · {item.quantity} disponíveis
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Preço em NC
                  <input
                    required
                    min="1"
                    type="number"
                    value={listingPrice}
                    onChange={(event) => setListingPrice(event.target.value)}
                  />
                </label>
                <button className="button button-primary" type="submit">
                  Publicar anúncio
                </button>
              </form>
            </section>
            <section className="content-section">
              <h2>Meus anúncios</h2>
              <div className="search-results">
                {initial.mine.map((listing) => (
                  <div className="search-result" key={listing.id}>
                    <strong>{listing.itemName}</strong>
                    <span>
                      {listing.price} NC · {listing.status}
                    </span>
                    {listing.status === 'active' && (
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => cancel(listing.id)}
                      >
                        Cancelar anúncio
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
            {initial.offers.length > 0 && (
              <section className="content-section">
                <h2>Ofertas recebidas</h2>
                <div className="search-results">
                  {initial.offers.map((received) => (
                    <div className="search-result" key={received.id}>
                      <strong>{received.itemName}</strong>
                      <span>
                        {received.amount} NC · {received.status}
                      </span>
                      {received.status === 'pending' && (
                        <button
                          className="button button-primary"
                          type="button"
                          onClick={() => accept(received.id)}
                        >
                          Aceitar oferta
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section className="content-section">
              <p className="eyebrow">VENDAS EM REAIS · SIMULADOR</p>
              <h2>Conta de recebimento</h2>
              <p className="form-help">
                A plataforma retém 20%; o vendedor recebe 80% após entrega e 24
                horas de contestação.
              </p>
              {initial.cashAccount?.status !== 'connected' ? (
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={connectPayment}
                >
                  Conectar Mercado Pago simulado
                </button>
              ) : (
                <>
                  <p className="form-success">Conta conectada.</p>
                  <form className="auth-form" onSubmit={announceCash}>
                    <label>
                      Item do cofre
                      <select
                        required
                        value={cashItem}
                        onChange={(event) => setCashItem(event.target.value)}
                      >
                        <option value="">Selecione</option>
                        {initial.profile.vault.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.itemName} · {item.quantity} disponíveis
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Preço em reais (centavos)
                      <input
                        required
                        min="100"
                        type="number"
                        value={cashPrice}
                        onChange={(event) => setCashPrice(event.target.value)}
                      />
                    </label>
                    <button className="button button-primary" type="submit">
                      Publicar venda em reais
                    </button>
                  </form>
                </>
              )}
              <div className="campaign-grid">
                {initial.cashListings.map((listing) => (
                  <article className="campaign-card" key={listing.id}>
                    <span>Venda protegida</span>
                    <h3>{listing.itemName}</h3>
                    <strong>
                      {(listing.price / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </strong>
                    {listing.sellerId !== initial.session.user.id && (
                      <button
                        className="button button-primary"
                        type="button"
                        onClick={() => buyCash(listing.id)}
                      >
                        Iniciar pagamento
                      </button>
                    )}
                  </article>
                ))}
              </div>
              <div className="account-card">
                <span>Saldo pendente</span>
                <strong>
                  {(
                    (initial.cashBalance?.pendingCents ?? 0) / 100
                  ).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
                <span>Saldo disponível</span>
                <strong>
                  {(
                    (initial.cashBalance?.availableCents ?? 0) / 100
                  ).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
              </div>
              {initial.cashPayouts.map((payout) => (
                <div className="search-result" key={payout.id}>
                  <strong>
                    {(payout.amountCents / 100).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </strong>
                  <span>Repasse · {payout.status}</span>
                  {payout.status === 'available' && (
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => requestPayout(payout.id)}
                    >
                      Solicitar saque
                    </button>
                  )}
                </div>
              ))}
              <div className="search-results">
                {initial.cashOrders.map((order) => (
                  <div className="search-result" key={order.id}>
                    <strong>Pedido em reais</strong>
                    <span>
                      {(order.grossCents / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}{' '}
                      · {order.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
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
