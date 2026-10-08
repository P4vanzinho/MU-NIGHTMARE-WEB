import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { getRequiredAdminSession } from '#/server/auth/session';
import { session, user } from '#/server/db/auth-schema';
import { db } from '#/server/db/client';
import { adminAuditEvent } from '#/server/db/schema';

const accountStatusInput = z.object({
  userId: z.string().min(1),
  action: z.enum(['ban', 'unban']),
  reason: z.string().trim().min(3).max(500),
});

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
};

export const getAdminAccounts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminAccount[]> => {
    await getRequiredAdminSession();
    const accounts = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        banned: user.banned,
        banReason: user.banReason,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt));

    return accounts.map((account) => ({
      ...account,
      role: account.role ?? 'player',
      banned: account.banned ?? false,
      createdAt: account.createdAt.toISOString(),
    }));
  },
);

export const updateAdminAccountStatus = createServerFn({ method: 'POST' })
  .validator(accountStatusInput)
  .handler(async ({ data }) => {
    const actor = await getRequiredAdminSession();
    const input = accountStatusInput.parse(data);

    if (actor.user.id === input.userId) {
      throw new Error(
        'O administrador atual não pode bloquear a própria conta.',
      );
    }

    const [target] = await db
      .select({ id: user.id, role: user.role, banned: user.banned })
      .from(user)
      .where(eq(user.id, input.userId))
      .limit(1);
    if (!target) throw new Error('Conta não encontrada.');

    if (input.action === 'ban' && target.role === 'admin' && !target.banned) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(user)
        .where(and(eq(user.role, 'admin'), eq(user.banned, false)));
      if (Number(count) <= 1) {
        throw new Error('O último administrador ativo não pode ser bloqueado.');
      }
    }

    const nextBanned = input.action === 'ban';
    await db.transaction(async (tx) => {
      await tx
        .update(user)
        .set({
          banned: nextBanned,
          banReason: nextBanned ? input.reason : null,
          banExpires: null,
        })
        .where(eq(user.id, input.userId));

      if (nextBanned) {
        await tx.delete(session).where(eq(session.userId, input.userId));
      }

      await tx.insert(adminAuditEvent).values({
        id: crypto.randomUUID(),
        actorUserId: actor.user.id,
        targetUserId: input.userId,
        action: input.action === 'ban' ? 'account.banned' : 'account.unbanned',
        reason: input.reason,
        createdAt: new Date(),
      });
    });

    return { ok: true, banned: nextBanned };
  });
