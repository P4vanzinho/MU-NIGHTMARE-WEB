import { createServerFn } from '@tanstack/react-start';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { getRequiredAdminSession } from '#/server/auth/session';
import { db } from '#/server/db/client';
import { campaign } from '#/server/db/schema';

const defaults = [
  [
    'play',
    'Comece sua jornada',
    'Crie sua conta e acompanhe seu progresso.',
    'Criar conta',
    '/register',
  ],
  [
    'events',
    'Eventos da semana',
    'Veja a agenda simulada do servidor.',
    'Ver eventos',
    '/events',
  ],
];

async function ensureCampaigns() {
  const [existing] = await db
    .select({ id: campaign.id })
    .from(campaign)
    .limit(1);
  if (existing) return;
  await db.insert(campaign).values(
    defaults.map(([slug, title, description, ctaLabel, ctaHref], position) => ({
      id: crypto.randomUUID(),
      slug,
      title,
      description,
      ctaLabel,
      ctaHref,
      active: true,
      position,
      updatedAt: new Date(),
    })),
  );
}

export const getActiveCampaigns = createServerFn({ method: 'GET' }).handler(
  async () => {
    await ensureCampaigns();
    return db
      .select()
      .from(campaign)
      .where(eq(campaign.active, true))
      .orderBy(asc(campaign.position));
  },
);

export const getAdminCampaigns = createServerFn({ method: 'GET' }).handler(
  async () => {
    await getRequiredAdminSession();
    await ensureCampaigns();
    return db.select().from(campaign).orderBy(asc(campaign.position));
  },
);

const campaignInput = z.object({
  id: z.string().optional(),
  slug: z.string().trim().min(2).max(80),
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().min(2).max(280),
  ctaLabel: z.string().trim().min(2).max(60),
  ctaHref: z
    .string()
    .trim()
    .regex(/^\//, 'O CTA deve apontar para uma rota interna.'),
  active: z.boolean(),
  position: z.number().int().min(0).max(99),
});

export const upsertCampaign = createServerFn({ method: 'POST' })
  .validator(campaignInput)
  .handler(async ({ data }) => {
    await getRequiredAdminSession();
    const values = { ...data, updatedAt: new Date() };
    if (data.id) {
      const [updated] = await db
        .update(campaign)
        .set(values)
        .where(eq(campaign.id, data.id))
        .returning();
      if (!updated) throw new Error('Campanha não encontrada.');
      return updated;
    }
    const [created] = await db
      .insert(campaign)
      .values({ ...values, id: crypto.randomUUID() })
      .returning();
    return created;
  });
