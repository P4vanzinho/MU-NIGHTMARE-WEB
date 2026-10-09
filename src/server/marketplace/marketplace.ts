import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';

import { getCurrentSession } from '#/server/auth/session';
import { user } from '#/server/db/auth-schema';
import { db } from '#/server/db/client';
import {
  simulatedMarketplaceListing,
  simulatedMarketplaceOffer,
  simulatedMarketplaceTrade,
  simulatedPlayerWallet,
  simulatedVaultItem,
} from '#/server/db/schema';

const listingInput = z.object({
  itemId: z.string().min(1),
  price: z.number().int().positive().max(2_000_000_000),
});

const searchInput = z.object({
  query: z.string().trim().max(80).optional().default(''),
  minPrice: z.number().int().nonnegative().optional(),
  maxPrice: z.number().int().positive().optional(),
  page: z.number().int().positive().max(10_000).optional().default(1),
});

export const getMarketplaceListings = createServerFn({ method: 'GET' })
  .validator(searchInput)
  .handler(async ({ data }) => {
    const filters = [eq(simulatedMarketplaceListing.status, 'active')];
    if (data.query) {
      filters.push(
        ilike(simulatedMarketplaceListing.itemName, `%${data.query}%`),
      );
    }
    if (data.minPrice !== undefined) {
      filters.push(
        sql`${simulatedMarketplaceListing.price} >= ${data.minPrice}`,
      );
    }
    if (data.maxPrice !== undefined) {
      filters.push(
        sql`${simulatedMarketplaceListing.price} <= ${data.maxPrice}`,
      );
    }
    const pageSize = 12;
    const offset = (data.page - 1) * pageSize;
    const [items, [{ count }]] = await Promise.all([
      db
        .select({
          id: simulatedMarketplaceListing.id,
          itemName: simulatedMarketplaceListing.itemName,
          quantity: simulatedMarketplaceListing.quantity,
          currency: simulatedMarketplaceListing.currency,
          price: simulatedMarketplaceListing.price,
          sellerName: user.name,
          sellerId: simulatedMarketplaceListing.sellerId,
          createdAt: simulatedMarketplaceListing.createdAt,
        })
        .from(simulatedMarketplaceListing)
        .innerJoin(user, eq(user.id, simulatedMarketplaceListing.sellerId))
        .where(and(...filters))
        .orderBy(desc(simulatedMarketplaceListing.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(simulatedMarketplaceListing)
        .where(and(...filters)),
    ]);
    return {
      items,
      page: data.page,
      pageSize,
      total: Number(count),
      totalPages: Math.max(1, Math.ceil(Number(count) / pageSize)),
    };
  });

export const getMyMarketplaceListings = createServerFn({
  method: 'GET',
}).handler(async () => {
  const session = await getCurrentSession();
  if (!session) throw new Error('Sessão necessária.');
  return db
    .select()
    .from(simulatedMarketplaceListing)
    .where(eq(simulatedMarketplaceListing.sellerId, session.user.id))
    .orderBy(desc(simulatedMarketplaceListing.createdAt));
});

export const createMarketplaceListing = createServerFn({ method: 'POST' })
  .validator(listingInput)
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    return db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(simulatedVaultItem)
        .where(
          and(
            eq(simulatedVaultItem.id, data.itemId),
            eq(simulatedVaultItem.ownerId, session.user.id),
            eq(simulatedVaultItem.location, 'vault'),
          ),
        )
        .limit(1);
      if (!item || item.quantity < 1)
        throw new Error('Item indisponível para anúncio.');

      if (item.quantity === 1) {
        await tx
          .delete(simulatedVaultItem)
          .where(eq(simulatedVaultItem.id, item.id));
      } else {
        await tx
          .update(simulatedVaultItem)
          .set({ quantity: item.quantity - 1 })
          .where(eq(simulatedVaultItem.id, item.id));
      }
      const [listing] = await tx
        .insert(simulatedMarketplaceListing)
        .values({
          id: crypto.randomUUID(),
          sellerId: session.user.id,
          itemName: item.itemName,
          quantity: 1,
          currency: 'NC',
          price: data.price,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return listing;
    });
  });

export const cancelMarketplaceListing = createServerFn({ method: 'POST' })
  .validator(z.object({ listingId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    return db.transaction(async (tx) => {
      const [listing] = await tx
        .update(simulatedMarketplaceListing)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(
          and(
            eq(simulatedMarketplaceListing.id, data.listingId),
            eq(simulatedMarketplaceListing.sellerId, session.user.id),
            eq(simulatedMarketplaceListing.status, 'active'),
          ),
        )
        .returning();
      if (!listing) throw new Error('Anúncio ativo não encontrado.');
      const [existing] = await tx
        .select()
        .from(simulatedVaultItem)
        .where(
          and(
            eq(simulatedVaultItem.ownerId, session.user.id),
            eq(simulatedVaultItem.itemName, listing.itemName),
            eq(simulatedVaultItem.location, 'vault'),
          ),
        )
        .limit(1);
      if (existing) {
        await tx
          .update(simulatedVaultItem)
          .set({ quantity: existing.quantity + listing.quantity })
          .where(eq(simulatedVaultItem.id, existing.id));
      } else {
        await tx.insert(simulatedVaultItem).values({
          id: crypto.randomUUID(),
          ownerId: session.user.id,
          itemName: listing.itemName,
          quantity: listing.quantity,
          location: 'vault',
        });
      }
      return listing;
    });
  });

export const buyMarketplaceListing = createServerFn({ method: 'POST' })
  .validator(z.object({ listingId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    return db.transaction(async (tx) => {
      const [listing] = await tx
        .update(simulatedMarketplaceListing)
        .set({ status: 'sold', updatedAt: new Date() })
        .where(
          and(
            eq(simulatedMarketplaceListing.id, data.listingId),
            eq(simulatedMarketplaceListing.status, 'active'),
          ),
        )
        .returning();
      if (!listing) throw new Error('Anúncio já vendido ou indisponível.');
      if (listing.sellerId === session.user.id)
        throw new Error('Você não pode comprar o próprio anúncio.');
      if (listing.currency !== 'NC')
        throw new Error('Moeda do anúncio não suportada no simulador.');

      const [buyerWallet] = await tx
        .select()
        .from(simulatedPlayerWallet)
        .where(eq(simulatedPlayerWallet.ownerId, session.user.id))
        .limit(1);
      if (!buyerWallet || buyerWallet.nightmareCoins < listing.price)
        throw new Error('Saldo de Nightmare Coins insuficiente.');
      await tx
        .update(simulatedPlayerWallet)
        .set({
          nightmareCoins: buyerWallet.nightmareCoins - listing.price,
          updatedAt: new Date(),
        })
        .where(eq(simulatedPlayerWallet.ownerId, session.user.id));
      await tx
        .insert(simulatedPlayerWallet)
        .values({
          ownerId: listing.sellerId,
          nightmareCoins: listing.price,
          vipLevel: 0,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: simulatedPlayerWallet.ownerId,
          set: {
            nightmareCoins: sql`${simulatedPlayerWallet.nightmareCoins} + ${listing.price}`,
            updatedAt: new Date(),
          },
        });
      await tx.insert(simulatedVaultItem).values({
        id: crypto.randomUUID(),
        ownerId: session.user.id,
        itemName: listing.itemName,
        quantity: listing.quantity,
        location: 'vault',
      });
      const [trade] = await tx
        .insert(simulatedMarketplaceTrade)
        .values({
          id: crypto.randomUUID(),
          listingId: listing.id,
          buyerId: session.user.id,
          sellerId: listing.sellerId,
          itemName: listing.itemName,
          quantity: listing.quantity,
          currency: listing.currency,
          amount: listing.price,
          status: 'completed',
          createdAt: new Date(),
        })
        .returning({ id: simulatedMarketplaceTrade.id });
      return trade;
    });
  });

export const createMarketplaceOffer = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      listingId: z.string().min(1),
      amount: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    const [listing] = await db
      .select()
      .from(simulatedMarketplaceListing)
      .where(eq(simulatedMarketplaceListing.id, data.listingId))
      .limit(1);
    if (listing?.status !== 'active') throw new Error('Anúncio indisponível.');
    if (listing.sellerId === session.user.id)
      throw new Error('Você não pode ofertar no próprio anúncio.');
    const [offer] = await db
      .insert(simulatedMarketplaceOffer)
      .values({
        id: crypto.randomUUID(),
        listingId: listing.id,
        buyerId: session.user.id,
        amount: data.amount,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: simulatedMarketplaceOffer.id });
    return offer;
  });

export const getMyMarketplaceOffers = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    return db
      .select({
        id: simulatedMarketplaceOffer.id,
        listingId: simulatedMarketplaceOffer.listingId,
        itemName: simulatedMarketplaceListing.itemName,
        amount: simulatedMarketplaceOffer.amount,
        status: simulatedMarketplaceOffer.status,
        sellerId: simulatedMarketplaceListing.sellerId,
      })
      .from(simulatedMarketplaceOffer)
      .innerJoin(
        simulatedMarketplaceListing,
        eq(simulatedMarketplaceListing.id, simulatedMarketplaceOffer.listingId),
      )
      .where(eq(simulatedMarketplaceOffer.buyerId, session.user.id))
      .orderBy(desc(simulatedMarketplaceOffer.createdAt));
  },
);

export const getMarketplaceOffersForSeller = createServerFn({
  method: 'GET',
}).handler(async () => {
  const session = await getCurrentSession();
  if (!session) throw new Error('Sessão necessária.');
  return db
    .select({
      id: simulatedMarketplaceOffer.id,
      listingId: simulatedMarketplaceOffer.listingId,
      itemName: simulatedMarketplaceListing.itemName,
      amount: simulatedMarketplaceOffer.amount,
      status: simulatedMarketplaceOffer.status,
      buyerId: simulatedMarketplaceOffer.buyerId,
    })
    .from(simulatedMarketplaceOffer)
    .innerJoin(
      simulatedMarketplaceListing,
      eq(simulatedMarketplaceListing.id, simulatedMarketplaceOffer.listingId),
    )
    .where(eq(simulatedMarketplaceListing.sellerId, session.user.id))
    .orderBy(desc(simulatedMarketplaceOffer.createdAt));
});

export const acceptMarketplaceOffer = createServerFn({ method: 'POST' })
  .validator(z.object({ offerId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    return db.transaction(async (tx) => {
      const [offer] = await tx
        .select({
          offer: simulatedMarketplaceOffer,
          listing: simulatedMarketplaceListing,
        })
        .from(simulatedMarketplaceOffer)
        .innerJoin(
          simulatedMarketplaceListing,
          eq(
            simulatedMarketplaceListing.id,
            simulatedMarketplaceOffer.listingId,
          ),
        )
        .where(
          and(
            eq(simulatedMarketplaceOffer.id, data.offerId),
            eq(simulatedMarketplaceListing.sellerId, session.user.id),
          ),
        )
        .limit(1);
      if (offer?.offer.status !== 'pending')
        throw new Error('Oferta indisponível.');
      if (offer.listing.status !== 'active')
        throw new Error('Anúncio já foi finalizado.');
      const [claimed] = await tx
        .update(simulatedMarketplaceListing)
        .set({ status: 'sold', updatedAt: new Date() })
        .where(
          and(
            eq(simulatedMarketplaceListing.id, offer.listing.id),
            eq(simulatedMarketplaceListing.status, 'active'),
          ),
        )
        .returning();
      if (!claimed) throw new Error('Anúncio já foi finalizado.');
      const [buyerWallet] = await tx
        .select()
        .from(simulatedPlayerWallet)
        .where(eq(simulatedPlayerWallet.ownerId, offer.offer.buyerId))
        .limit(1);
      if (!buyerWallet || buyerWallet.nightmareCoins < offer.offer.amount)
        throw new Error('Comprador sem saldo suficiente.');
      await tx
        .update(simulatedPlayerWallet)
        .set({
          nightmareCoins: buyerWallet.nightmareCoins - offer.offer.amount,
          updatedAt: new Date(),
        })
        .where(eq(simulatedPlayerWallet.ownerId, offer.offer.buyerId));
      await tx
        .insert(simulatedPlayerWallet)
        .values({
          ownerId: session.user.id,
          nightmareCoins: offer.offer.amount,
          vipLevel: 0,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: simulatedPlayerWallet.ownerId,
          set: {
            nightmareCoins: sql`${simulatedPlayerWallet.nightmareCoins} + ${offer.offer.amount}`,
            updatedAt: new Date(),
          },
        });
      await tx.insert(simulatedVaultItem).values({
        id: crypto.randomUUID(),
        ownerId: offer.offer.buyerId,
        itemName: claimed.itemName,
        quantity: claimed.quantity,
        location: 'vault',
      });
      await tx
        .update(simulatedMarketplaceOffer)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(simulatedMarketplaceOffer.id, offer.offer.id));
      await tx
        .update(simulatedMarketplaceOffer)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(
          and(
            eq(simulatedMarketplaceOffer.listingId, claimed.id),
            eq(simulatedMarketplaceOffer.status, 'pending'),
          ),
        );
      const [trade] = await tx
        .insert(simulatedMarketplaceTrade)
        .values({
          id: crypto.randomUUID(),
          listingId: claimed.id,
          buyerId: offer.offer.buyerId,
          sellerId: session.user.id,
          itemName: claimed.itemName,
          quantity: claimed.quantity,
          currency: claimed.currency,
          amount: offer.offer.amount,
          status: 'completed',
          createdAt: new Date(),
        })
        .returning({ id: simulatedMarketplaceTrade.id });
      return trade;
    });
  });

export const getMarketplaceOwnerName = createServerFn({ method: 'GET' })
  .validator(z.object({ sellerId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const [seller] = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, data.sellerId))
      .limit(1);
    return seller?.name ?? 'Jogador';
  });
