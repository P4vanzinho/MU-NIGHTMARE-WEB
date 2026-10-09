import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  getCurrentSession,
  getRequiredAdminSession,
} from '#/server/auth/session';
import { db } from '#/server/db/client';
import {
  shopProduct,
  simulatedBenefitGrant,
  simulatedOrder,
  simulatedPaymentEvent,
  simulatedPlayerWallet,
} from '#/server/db/schema';

const defaults = [
  [
    'vip-nightmare',
    'VIP Nightmare',
    'Benefício de teste para a temporada local.',
    'BRL',
    1990,
    'VIP nível 1 por 30 dias',
    'Conta ativa',
  ],
  [
    'nightmare-coins-500',
    '500 Nightmare Coins',
    'Saldo próprio do portal em ambiente simulado.',
    'BRL',
    1490,
    '500 Nightmare Coins simulados',
    'Conta verificada',
  ],
] as const;

async function ensureProducts() {
  const [existing] = await db
    .select({ id: shopProduct.id })
    .from(shopProduct)
    .limit(1);
  if (existing) return;
  await db.insert(shopProduct).values(
    defaults.map(
      ([
        slug,
        name,
        description,
        currency,
        priceCents,
        benefit,
        eligibility,
      ]) => ({
        id: crypto.randomUUID(),
        slug,
        name,
        description,
        currency,
        priceCents,
        benefit,
        eligibility,
        active: true,
        updatedAt: new Date(),
      }),
    ),
  );
}

export const getShopProducts = createServerFn({ method: 'GET' }).handler(
  async () => {
    await ensureProducts();
    return db
      .select()
      .from(shopProduct)
      .where(eq(shopProduct.active, true))
      .orderBy(asc(shopProduct.name));
  },
);
export const getAdminShopProducts = createServerFn({ method: 'GET' }).handler(
  async () => {
    await getRequiredAdminSession();
    await ensureProducts();
    return db.select().from(shopProduct).orderBy(asc(shopProduct.name));
  },
);

const productInput = z.object({
  id: z.string().optional(),
  slug: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(280),
  currency: z.string().trim().min(3).max(8),
  priceCents: z.number().int().positive(),
  benefit: z.string().trim().min(2).max(160),
  eligibility: z.string().trim().min(2).max(160),
  active: z.boolean(),
});
export const upsertShopProduct = createServerFn({ method: 'POST' })
  .validator(productInput)
  .handler(async ({ data }) => {
    await getRequiredAdminSession();
    const values = { ...data, updatedAt: new Date() };
    if (data.id) {
      const [updated] = await db
        .update(shopProduct)
        .set(values)
        .where(eq(shopProduct.id, data.id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(shopProduct)
      .values({ ...values, id: crypto.randomUUID() })
      .returning();
    return created;
  });

export const getMyOrders = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    return db
      .select({
        protocol: simulatedOrder.protocol,
        productName: shopProduct.name,
        priceCents: simulatedOrder.priceCents,
        currency: simulatedOrder.currency,
        status: simulatedOrder.status,
        createdAt: simulatedOrder.createdAt,
      })
      .from(simulatedOrder)
      .innerJoin(shopProduct, eq(shopProduct.id, simulatedOrder.productId))
      .where(eq(simulatedOrder.buyerId, session.user.id))
      .orderBy(desc(simulatedOrder.createdAt));
  },
);

export const createSimulatedOrder = createServerFn({ method: 'POST' })
  .validator(z.object({ productId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    const [product] = await db
      .select()
      .from(shopProduct)
      .where(
        and(eq(shopProduct.id, data.productId), eq(shopProduct.active, true)),
      )
      .limit(1);
    if (!product) throw new Error('Produto indisponível.');
    const now = new Date();
    const [order] = await db
      .insert(simulatedOrder)
      .values({
        id: crypto.randomUUID(),
        protocol: `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        buyerId: session.user.id,
        productId: product.id,
        currency: product.currency,
        priceCents: product.priceCents,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      })
      .returning({ protocol: simulatedOrder.protocol });
    return order;
  });

const paymentInput = z.object({
  orderProtocol: z.string().min(1),
  eventId: z.string().min(8),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'expired']),
});
export const simulatePaymentEvent = createServerFn({ method: 'POST' })
  .validator(paymentInput)
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    return db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(simulatedOrder)
        .where(
          and(
            eq(simulatedOrder.protocol, data.orderProtocol),
            eq(simulatedOrder.buyerId, session.user.id),
          ),
        )
        .limit(1);
      if (!order) throw new Error('Pedido não encontrado.');
      const [event] = await tx
        .insert(simulatedPaymentEvent)
        .values({
          id: crypto.randomUUID(),
          eventId: data.eventId,
          orderId: order.id,
          status: data.status,
          createdAt: new Date(),
        })
        .onConflictDoNothing({ target: simulatedPaymentEvent.eventId })
        .returning();
      if (!event) return { status: order.status };
      const terminal = new Set(['confirmed', 'cancelled', 'expired']);
      if (terminal.has(order.status)) return { status: order.status };
      const [updated] = await tx
        .update(simulatedOrder)
        .set({ status: data.status, updatedAt: new Date() })
        .where(eq(simulatedOrder.id, order.id))
        .returning({ status: simulatedOrder.status });

      if (data.status === 'confirmed') {
        const [product] = await tx
          .select({ benefit: shopProduct.benefit })
          .from(shopProduct)
          .where(eq(shopProduct.id, order.productId))
          .limit(1);
        if (!product) throw new Error('Produto do pedido não encontrado.');

        const [grant] = await tx
          .insert(simulatedBenefitGrant)
          .values({
            id: crypto.randomUUID(),
            reference: `order:${order.id}`,
            orderId: order.id,
            ownerId: order.buyerId,
            benefit: product.benefit,
            status: 'granted',
            createdAt: new Date(),
          })
          .onConflictDoNothing({ target: simulatedBenefitGrant.reference })
          .returning({ id: simulatedBenefitGrant.id });

        const coins = Number(product.benefit.match(/\d+/)?.[0] ?? 0);
        if (grant && coins > 0 && product.benefit.includes('Nightmare Coins')) {
          await tx
            .insert(simulatedPlayerWallet)
            .values({
              ownerId: order.buyerId,
              nightmareCoins: coins,
              vipLevel: 0,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: simulatedPlayerWallet.ownerId,
              set: {
                nightmareCoins: sql`${simulatedPlayerWallet.nightmareCoins} + ${coins}`,
                updatedAt: new Date(),
              },
            });
        }
      }
      return updated;
    });
  });
