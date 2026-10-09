import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { getCurrentSession } from '#/server/auth/session';
import { getMyGameProfile } from '#/server/game-profile/profile';
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
    const [session, market] = await Promise.all([
      getCurrentSession(),
      getMarketplaceListings({ data: { page: 1 } }),
    ]);
    if (!session)
      return { session: null, market, profile: null, mine: [], offers: [] };
    const [profile, mine, offers] = await Promise.all([
      getMyGameProfile(),
      getMyMarketplaceListings(),
      getMarketplaceOffersForSeller(),
    ]);
    return { session, market, profile, mine, offers };
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
