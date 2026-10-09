import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getCurrentSession } from '#/server/auth/session';
import { user } from '#/server/db/auth-schema';
import { db } from '#/server/db/client';
import { simulatedItemTransfer, simulatedVaultItem } from '#/server/db/schema';

const input = z.object({
  targetEmail: z.string().email(),
  itemId: z.string().min(1),
  quantity: z.number().int().positive().max(999),
});

export const transferSimulatedItem = createServerFn({ method: 'POST' })
  .validator(input)
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    if (data.targetEmail === session.user.email)
      throw new Error('Escolha outro jogador.');
    const [target] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, data.targetEmail))
      .limit(1);
    if (!target) throw new Error('Jogador destinatário não encontrado.');
    return db.transaction(async (tx) => {
      const [source] = await tx
        .select()
        .from(simulatedVaultItem)
        .where(
          and(
            eq(simulatedVaultItem.id, data.itemId),
            eq(simulatedVaultItem.ownerId, session.user.id),
          ),
        )
        .limit(1);
      if (!source || source.quantity < data.quantity)
        throw new Error('Quantidade indisponível no cofre.');
      const remaining = source.quantity - data.quantity;
      if (remaining === 0)
        await tx
          .delete(simulatedVaultItem)
          .where(eq(simulatedVaultItem.id, source.id));
      else
        await tx
          .update(simulatedVaultItem)
          .set({ quantity: remaining })
          .where(eq(simulatedVaultItem.id, source.id));
      const [destination] = await tx
        .select()
        .from(simulatedVaultItem)
        .where(
          and(
            eq(simulatedVaultItem.ownerId, target.id),
            eq(simulatedVaultItem.itemName, source.itemName),
          ),
        )
        .limit(1);
      if (destination)
        await tx
          .update(simulatedVaultItem)
          .set({ quantity: destination.quantity + data.quantity })
          .where(eq(simulatedVaultItem.id, destination.id));
      else
        await tx.insert(simulatedVaultItem).values({
          id: crypto.randomUUID(),
          ownerId: target.id,
          itemName: source.itemName,
          quantity: data.quantity,
          location: 'vault',
        });
      const [transfer] = await tx
        .insert(simulatedItemTransfer)
        .values({
          id: crypto.randomUUID(),
          protocol: `TR-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          sourceOwnerId: session.user.id,
          targetOwnerId: target.id,
          itemName: source.itemName,
          quantity: data.quantity,
          createdAt: new Date(),
        })
        .returning({ protocol: simulatedItemTransfer.protocol });
      return transfer;
    });
  });
