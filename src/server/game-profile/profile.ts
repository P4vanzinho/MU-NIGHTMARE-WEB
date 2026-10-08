import { createServerFn } from '@tanstack/react-start';
import { asc, eq } from 'drizzle-orm';

import { getCurrentSession } from '#/server/auth/session';
import { db } from '#/server/db/client';
import {
  simulatedCharacter,
  simulatedPlayerWallet,
  simulatedVaultItem,
} from '#/server/db/schema';

export type GameProfileSnapshot = {
  characters: Array<{
    id: string;
    name: string;
    characterClass: string;
    level: number;
  }>;
  vault: Array<{
    id: string;
    itemName: string;
    quantity: number;
    location: string;
  }>;
  wallet: { nightmareCoins: number; vipLevel: number };
};

async function ensureProfile(ownerId: string) {
  const [character] = await db
    .select({ id: simulatedCharacter.id })
    .from(simulatedCharacter)
    .where(eq(simulatedCharacter.ownerId, ownerId))
    .limit(1);
  if (character) return;
  const now = new Date();
  await db.insert(simulatedCharacter).values({
    id: crypto.randomUUID(),
    ownerId,
    name: 'Ranger do Nightmare',
    characterClass: 'Blade Knight',
    level: 120,
    updatedAt: now,
  });
  await db.insert(simulatedVaultItem).values([
    {
      id: crypto.randomUUID(),
      ownerId,
      itemName: 'Bless of Guardian',
      quantity: 12,
      location: 'vault',
    },
    {
      id: crypto.randomUUID(),
      ownerId,
      itemName: 'Jewel of Chaos',
      quantity: 5,
      location: 'vault',
    },
  ]);
  await db.insert(simulatedPlayerWallet).values({
    ownerId,
    nightmareCoins: 250,
    vipLevel: 1,
    updatedAt: now,
  });
}

export const getMyGameProfile = createServerFn({ method: 'GET' }).handler(
  async (): Promise<GameProfileSnapshot> => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Sessão necessária.');
    await ensureProfile(session.user.id);
    const [characters, vault, [wallet]] = await Promise.all([
      db
        .select({
          id: simulatedCharacter.id,
          name: simulatedCharacter.name,
          characterClass: simulatedCharacter.characterClass,
          level: simulatedCharacter.level,
        })
        .from(simulatedCharacter)
        .where(eq(simulatedCharacter.ownerId, session.user.id))
        .orderBy(asc(simulatedCharacter.name)),
      db
        .select({
          id: simulatedVaultItem.id,
          itemName: simulatedVaultItem.itemName,
          quantity: simulatedVaultItem.quantity,
          location: simulatedVaultItem.location,
        })
        .from(simulatedVaultItem)
        .where(eq(simulatedVaultItem.ownerId, session.user.id))
        .orderBy(asc(simulatedVaultItem.itemName)),
      db
        .select({
          nightmareCoins: simulatedPlayerWallet.nightmareCoins,
          vipLevel: simulatedPlayerWallet.vipLevel,
        })
        .from(simulatedPlayerWallet)
        .where(eq(simulatedPlayerWallet.ownerId, session.user.id))
        .limit(1),
    ]);
    return {
      characters,
      vault,
      wallet: wallet ?? { nightmareCoins: 0, vipLevel: 0 },
    };
  },
);
