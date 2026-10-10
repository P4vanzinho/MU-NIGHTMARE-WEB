import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import {
  getCurrentSession,
  getRequiredAdminSession,
} from '#/server/auth/session';
import { db } from '#/server/db/client';
import {
  adminAuditEvent,
  simulatedCashDispute,
  simulatedCashOrder,
  simulatedCashPaymentEvent,
  simulatedCashPayout,
  simulatedMarketplaceListing,
  simulatedSellerBalance,
  simulatedSellerPaymentAccount,
  simulatedVaultItem,
} from '#/server/db/schema';

const RESERVATION_MINUTES = 15;
const CONTESTATION_HOURS = 24;

async function recordCashAudit(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  actorUserId: string,
  targetUserId: string,
  action: string,
  reason: string,
) {
  await tx.insert(adminAuditEvent).values({
    id: crypto.randomUUID(),
    actorUserId,
    targetUserId,
    action,
    reason,
    createdAt: new Date(),
  });
}

async function returnListingItem(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  ownerId: string,
  itemName: string,
  quantity: number,
) {
  const [existing] = await tx
    .select()
    .from(simulatedVaultItem)
    .where(
      and(
        eq(simulatedVaultItem.ownerId, ownerId),
        eq(simulatedVaultItem.itemName, itemName),
        eq(simulatedVaultItem.location, 'vault'),
      ),
    )
    .limit(1);
  if (existing) {
    await tx
      .update(simulatedVaultItem)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(simulatedVaultItem.id, existing.id));
    return;
  }
  await tx.insert(simulatedVaultItem).values({
    id: crypto.randomUUID(),
    ownerId,
    itemName,
    quantity,
    location: 'vault',
  });
}

export const getSellerPaymentAccount = createServerFn({
  method: 'GET',
}).handler(async () => {
  const session = await getCurrentSession();
  if (!session) throw new Error('Sessão necessária.');
  const [account] = await db
    .select()
    .from(simulatedSellerPaymentAccount)
    .where(eq(simulatedSellerPaymentAccount.ownerId, session.user.id))
    .limit(1);
  return account ?? { status: 'not_connected', provider: 'mercado_pago' };
});

export const connectSimulatedPaymentAccount = createServerFn({
  method: 'POST',
}).handler(async () => {
  const session = await getCurrentSession();
  if (!session) throw new Error('Sessão necessária.');
  const [account] = await db
    .insert(simulatedSellerPaymentAccount)
    .values({
      id: crypto.randomUUID(),
      ownerId: session.user.id,
      provider: 'mercado_pago',
      status: 'connected',
      externalReference: `mp-local-${crypto.randomUUID()}`,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: simulatedSellerPaymentAccount.ownerId,
      set: {
        status: 'connected',
        externalReference: `mp-local-${crypto.randomUUID()}`,
        updatedAt: new Date(),
      },
    })
    .returning();
  return account;
});

export const getCashListings = createServerFn({ method: 'GET' }).handler(
  async () =>
    db
      .select()
      .from(simulatedMarketplaceListing)
      .where(
        and(
          eq(simulatedMarketplaceListing.currency, 'BRL'),
          eq(simulatedMarketplaceListing.status, 'active'),
        ),
      )
      .orderBy(desc(simulatedMarketplaceListing.createdAt)),
);

export const createCashListing = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      itemId: z.string().min(1),
      priceCents: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    const [account] = await db
      .select({ status: simulatedSellerPaymentAccount.status })
      .from(simulatedSellerPaymentAccount)
      .where(eq(simulatedSellerPaymentAccount.ownerId, session.user.id))
      .limit(1);
    if (account?.status !== 'connected')
      throw new Error(
        'Conecte uma conta de pagamento antes de vender em reais.',
      );
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
      if (!item || item.quantity < 1) throw new Error('Item indisponível.');
      if (item.quantity === 1)
        await tx
          .delete(simulatedVaultItem)
          .where(eq(simulatedVaultItem.id, item.id));
      else
        await tx
          .update(simulatedVaultItem)
          .set({ quantity: item.quantity - 1 })
          .where(eq(simulatedVaultItem.id, item.id));
      const [listing] = await tx
        .insert(simulatedMarketplaceListing)
        .values({
          id: crypto.randomUUID(),
          sellerId: session.user.id,
          itemName: item.itemName,
          quantity: 1,
          currency: 'BRL',
          price: data.priceCents,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return listing;
    });
  });

export const getMyCashOrders = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    return db
      .select()
      .from(simulatedCashOrder)
      .where(
        sql`${simulatedCashOrder.buyerId} = ${session.user.id} OR ${simulatedCashOrder.sellerId} = ${session.user.id}`,
      )
      .orderBy(desc(simulatedCashOrder.createdAt));
  },
);

export const initiateCashOrder = createServerFn({ method: 'POST' })
  .validator(z.object({ listingId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    return db.transaction(async (tx) => {
      const [listing] = await tx
        .update(simulatedMarketplaceListing)
        .set({ status: 'reserved', updatedAt: new Date() })
        .where(
          and(
            eq(simulatedMarketplaceListing.id, data.listingId),
            eq(simulatedMarketplaceListing.currency, 'BRL'),
            eq(simulatedMarketplaceListing.status, 'active'),
          ),
        )
        .returning();
      if (!listing) throw new Error('Anúncio já reservado ou indisponível.');
      if (listing.sellerId === session.user.id)
        throw new Error('Você não pode comprar o próprio anúncio.');
      const now = new Date();
      const expires = new Date(now.getTime() + RESERVATION_MINUTES * 60_000);
      const [order] = await tx
        .insert(simulatedCashOrder)
        .values({
          id: crypto.randomUUID(),
          listingId: listing.id,
          buyerId: session.user.id,
          sellerId: listing.sellerId,
          grossCents: listing.price,
          platformFeeCents: Math.floor(listing.price * 0.2),
          sellerNetCents: listing.price - Math.floor(listing.price * 0.2),
          status: 'reserved',
          reservationExpiresAt: expires,
          contestationEndsAt: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return order;
    });
  });

export const simulateCashPayment = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      orderId: z.string().min(1),
      eventId: z.string().min(8),
      status: z.enum(['confirmed', 'failed']),
    }),
  )
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    return db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(simulatedCashOrder)
        .where(
          and(
            eq(simulatedCashOrder.id, data.orderId),
            eq(simulatedCashOrder.buyerId, session.user.id),
          ),
        )
        .limit(1);
      if (!order) throw new Error('Pedido não encontrado.');
      const [event] = await tx
        .insert(simulatedCashPaymentEvent)
        .values({
          id: crypto.randomUUID(),
          eventId: data.eventId,
          orderId: order.id,
          status: data.status,
          createdAt: new Date(),
        })
        .onConflictDoNothing({ target: simulatedCashPaymentEvent.eventId })
        .returning();
      if (!event) return order;
      const now = new Date();
      if (order.status !== 'reserved') return order;
      if (now > order.reservationExpiresAt) {
        await tx
          .update(simulatedCashOrder)
          .set({ status: 'late_confirmation', updatedAt: now })
          .where(eq(simulatedCashOrder.id, order.id));
        await tx
          .update(simulatedMarketplaceListing)
          .set({ status: 'active', updatedAt: now })
          .where(eq(simulatedMarketplaceListing.id, order.listingId));
        const [listing] = await tx
          .select()
          .from(simulatedMarketplaceListing)
          .where(eq(simulatedMarketplaceListing.id, order.listingId))
          .limit(1);
        if (listing)
          await returnListingItem(
            tx,
            listing.sellerId,
            listing.itemName,
            listing.quantity,
          );
        return { ...order, status: 'late_confirmation' };
      }
      const nextStatus =
        data.status === 'confirmed' ? 'delivery_pending' : 'payment_failed';
      const [updated] = await tx
        .update(simulatedCashOrder)
        .set({ status: nextStatus, updatedAt: now })
        .where(eq(simulatedCashOrder.id, order.id))
        .returning();
      if (data.status === 'failed')
        await tx
          .update(simulatedMarketplaceListing)
          .set({ status: 'active', updatedAt: now })
          .where(eq(simulatedMarketplaceListing.id, order.listingId));
      if (data.status === 'failed') {
        const [listing] = await tx
          .select()
          .from(simulatedMarketplaceListing)
          .where(eq(simulatedMarketplaceListing.id, order.listingId))
          .limit(1);
        if (listing)
          await returnListingItem(
            tx,
            order.sellerId,
            listing.itemName,
            listing.quantity,
          );
      }
      return updated;
    });
  });

export const simulateCashDelivery = createServerFn({ method: 'POST' })
  .validator(z.object({ orderId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const admin = await getRequiredAdminSession();
    return db.transaction(async (tx) => {
      const [order] = await tx
        .select({
          order: simulatedCashOrder,
          listing: simulatedMarketplaceListing,
        })
        .from(simulatedCashOrder)
        .innerJoin(
          simulatedMarketplaceListing,
          eq(simulatedMarketplaceListing.id, simulatedCashOrder.listingId),
        )
        .where(eq(simulatedCashOrder.id, data.orderId))
        .limit(1);
      if (order?.order.status !== 'delivery_pending')
        throw new Error('Pedido não aguarda entrega.');
      const now = new Date();
      const contestationEnds = new Date(
        now.getTime() + CONTESTATION_HOURS * 3_600_000,
      );
      await tx
        .update(simulatedCashOrder)
        .set({
          status: 'delivered',
          contestationEndsAt: contestationEnds,
          updatedAt: now,
        })
        .where(eq(simulatedCashOrder.id, data.orderId));
      await tx
        .update(simulatedMarketplaceListing)
        .set({ status: 'sold', updatedAt: now })
        .where(eq(simulatedMarketplaceListing.id, order.listing.id));
      await tx.insert(simulatedVaultItem).values({
        id: crypto.randomUUID(),
        ownerId: order.order.buyerId,
        itemName: order.listing.itemName,
        quantity: order.listing.quantity,
        location: 'vault',
      });
      await tx.insert(simulatedCashPayout).values({
        id: crypto.randomUUID(),
        orderId: order.order.id,
        sellerId: order.order.sellerId,
        amountCents: order.order.sellerNetCents,
        status: 'held',
      });
      await tx
        .insert(simulatedSellerBalance)
        .values({
          ownerId: order.order.sellerId,
          pendingCents: order.order.sellerNetCents,
          availableCents: 0,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: simulatedSellerBalance.ownerId,
          set: {
            pendingCents: sql`${simulatedSellerBalance.pendingCents} + ${order.order.sellerNetCents}`,
            updatedAt: now,
          },
        });
      await recordCashAudit(
        tx,
        admin.user.id,
        order.order.sellerId,
        'cash_order.delivery_confirmed',
        `Entrega simulada confirmada para ${order.order.id}`,
      );
      return { status: 'delivered', contestationEndsAt: contestationEnds };
    });
  });

export const releaseCashOrder = createServerFn({ method: 'POST' })
  .validator(
    z.object({ orderId: z.string().min(1), force: z.boolean().default(false) }),
  )
  .handler(async ({ data }) => {
    const admin = await getRequiredAdminSession();
    return db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(simulatedCashOrder)
        .where(eq(simulatedCashOrder.id, data.orderId))
        .limit(1);
      if (order?.status !== 'delivered')
        throw new Error('Pedido não está em contestação.');
      if (
        !data.force &&
        (!order.contestationEndsAt || order.contestationEndsAt > new Date())
      )
        throw new Error('A janela de contestação ainda está aberta.');
      const [payout] = await tx
        .update(simulatedCashPayout)
        .set({ status: 'available' })
        .where(
          and(
            eq(simulatedCashPayout.orderId, order.id),
            eq(simulatedCashPayout.status, 'held'),
          ),
        )
        .returning();
      if (!payout) throw new Error('Repasse já liberado ou inexistente.');
      await tx
        .update(simulatedCashOrder)
        .set({ status: 'available', updatedAt: new Date() })
        .where(eq(simulatedCashOrder.id, order.id));
      await tx
        .update(simulatedSellerBalance)
        .set({
          pendingCents: sql`GREATEST(${simulatedSellerBalance.pendingCents} - ${order.sellerNetCents}, 0)`,
          availableCents: sql`${simulatedSellerBalance.availableCents} + ${order.sellerNetCents}`,
          updatedAt: new Date(),
        })
        .where(eq(simulatedSellerBalance.ownerId, order.sellerId));
      await recordCashAudit(
        tx,
        admin.user.id,
        order.sellerId,
        'cash_order.released',
        `Contestação encerrada para ${order.id}`,
      );
      return { status: 'available' };
    });
  });

export const getSellerCashBalance = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    const [balance] = await db
      .select()
      .from(simulatedSellerBalance)
      .where(eq(simulatedSellerBalance.ownerId, session.user.id))
      .limit(1);
    return balance ?? { pendingCents: 0, availableCents: 0 };
  },
);

export const requestCashPayout = createServerFn({ method: 'POST' })
  .validator(z.object({ payoutId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    const [payout] = await db
      .update(simulatedCashPayout)
      .set({ status: 'requested', requestedAt: new Date() })
      .where(
        and(
          eq(simulatedCashPayout.id, data.payoutId),
          eq(simulatedCashPayout.sellerId, session.user.id),
          eq(simulatedCashPayout.status, 'available'),
        ),
      )
      .returning();
    if (!payout) throw new Error('Repasse disponível não encontrado.');
    return payout;
  });

export const getMyCashPayouts = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    return db
      .select()
      .from(simulatedCashPayout)
      .where(eq(simulatedCashPayout.sellerId, session.user.id))
      .orderBy(desc(simulatedCashPayout.requestedAt));
  },
);

export const settleCashPayout = createServerFn({ method: 'POST' })
  .validator(z.object({ payoutId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const admin = await getRequiredAdminSession();
    const [payout] = await db
      .update(simulatedCashPayout)
      .set({ status: 'paid', settledAt: new Date() })
      .where(
        and(
          eq(simulatedCashPayout.id, data.payoutId),
          eq(simulatedCashPayout.status, 'requested'),
        ),
      )
      .returning();
    if (!payout) throw new Error('Saque solicitado não encontrado.');
    await db.insert(adminAuditEvent).values({
      id: crypto.randomUUID(),
      actorUserId: admin.user.id,
      targetUserId: payout.sellerId,
      action: 'cash_payout.settled',
      reason: `Saque simulado ${payout.id} liquidado`,
      createdAt: new Date(),
    });
    return payout;
  });

export const getAdminCashPayouts = createServerFn({ method: 'GET' }).handler(
  async () => {
    await getRequiredAdminSession();
    return db
      .select()
      .from(simulatedCashPayout)
      .orderBy(desc(simulatedCashPayout.requestedAt));
  },
);

export const expireCashReservations = createServerFn({
  method: 'POST',
}).handler(async () => {
  const admin = await getRequiredAdminSession();
  const now = new Date();
  return db.transaction(async (tx) => {
    const expired = await tx
      .select()
      .from(simulatedCashOrder)
      .where(
        and(
          eq(simulatedCashOrder.status, 'reserved'),
          sql`${simulatedCashOrder.reservationExpiresAt} <= ${now}`,
        ),
      );
    for (const order of expired) {
      const [listing] = await tx
        .select()
        .from(simulatedMarketplaceListing)
        .where(eq(simulatedMarketplaceListing.id, order.listingId))
        .limit(1);
      if (listing) {
        await tx
          .update(simulatedMarketplaceListing)
          .set({ status: 'active', updatedAt: now })
          .where(eq(simulatedMarketplaceListing.id, listing.id));
        await returnListingItem(
          tx,
          listing.sellerId,
          listing.itemName,
          listing.quantity,
        );
      }
      await tx
        .update(simulatedCashOrder)
        .set({ status: 'expired', updatedAt: now })
        .where(eq(simulatedCashOrder.id, order.id));
      await recordCashAudit(
        tx,
        admin.user.id,
        order.sellerId,
        'cash_order.expired',
        `Reserva expirada para ${order.id}`,
      );
    }
    return { expired: expired.length };
  });
});

export const openCashDispute = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      orderId: z.string().min(1),
      reason: z.string().trim().min(10).max(500),
    }),
  )
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    return db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(simulatedCashOrder)
        .where(
          and(
            eq(simulatedCashOrder.id, data.orderId),
            eq(simulatedCashOrder.buyerId, session.user.id),
            eq(simulatedCashOrder.status, 'delivered'),
          ),
        )
        .limit(1);
      if (!order?.contestationEndsAt || order.contestationEndsAt < new Date())
        throw new Error('A janela de contestação está fechada.');
      const [dispute] = await tx
        .insert(simulatedCashDispute)
        .values({
          id: crypto.randomUUID(),
          orderId: order.id,
          reporterId: session.user.id,
          reason: data.reason,
          status: 'open',
          resolution: null,
          createdAt: new Date(),
          resolvedAt: null,
        })
        .returning();
      await tx
        .update(simulatedCashOrder)
        .set({ status: 'disputed', updatedAt: new Date() })
        .where(eq(simulatedCashOrder.id, order.id));
      return dispute;
    });
  });

export const getAdminCashOrders = createServerFn({ method: 'GET' }).handler(
  async () => {
    await getRequiredAdminSession();
    return db
      .select()
      .from(simulatedCashOrder)
      .orderBy(desc(simulatedCashOrder.createdAt));
  },
);

export const getAdminCashDisputes = createServerFn({ method: 'GET' }).handler(
  async () => {
    await getRequiredAdminSession();
    return db
      .select()
      .from(simulatedCashDispute)
      .orderBy(desc(simulatedCashDispute.createdAt));
  },
);

export const resolveCashDispute = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      disputeId: z.string().min(1),
      outcome: z.enum(['refund', 'reject']),
    }),
  )
  .handler(async ({ data }) => {
    const admin = await getRequiredAdminSession();
    return db.transaction(async (tx) => {
      const [dispute] = await tx
        .select({
          dispute: simulatedCashDispute,
          order: simulatedCashOrder,
          listing: simulatedMarketplaceListing,
        })
        .from(simulatedCashDispute)
        .innerJoin(
          simulatedCashOrder,
          eq(simulatedCashOrder.id, simulatedCashDispute.orderId),
        )
        .innerJoin(
          simulatedMarketplaceListing,
          eq(simulatedMarketplaceListing.id, simulatedCashOrder.listingId),
        )
        .where(
          and(
            eq(simulatedCashDispute.id, data.disputeId),
            eq(simulatedCashDispute.status, 'open'),
          ),
        )
        .limit(1);
      if (!dispute) throw new Error('Disputa aberta não encontrada.');
      const now = new Date();
      if (data.outcome === 'refund') {
        await tx
          .update(simulatedCashOrder)
          .set({ status: 'refunded', updatedAt: now })
          .where(eq(simulatedCashOrder.id, dispute.order.id));
        await tx
          .update(simulatedCashPayout)
          .set({ status: 'refunded' })
          .where(eq(simulatedCashPayout.orderId, dispute.order.id));
        await tx
          .update(simulatedSellerBalance)
          .set({
            pendingCents: sql`GREATEST(${simulatedSellerBalance.pendingCents} - ${dispute.order.sellerNetCents}, 0)`,
            availableCents: sql`GREATEST(${simulatedSellerBalance.availableCents} - ${dispute.order.sellerNetCents}, 0)`,
            updatedAt: now,
          })
          .where(eq(simulatedSellerBalance.ownerId, dispute.order.sellerId));
      } else {
        await tx
          .update(simulatedCashOrder)
          .set({ status: 'delivered', updatedAt: now })
          .where(eq(simulatedCashOrder.id, dispute.order.id));
      }
      const [resolved] = await tx
        .update(simulatedCashDispute)
        .set({ status: 'resolved', resolution: data.outcome, resolvedAt: now })
        .where(eq(simulatedCashDispute.id, dispute.dispute.id))
        .returning();
      await recordCashAudit(
        tx,
        admin.user.id,
        dispute.order.sellerId,
        `cash_dispute.${data.outcome}`,
        `Disputa ${dispute.dispute.id} resolvida como ${data.outcome}`,
      );
      return resolved;
    });
  });
