import { createServerFn } from '@tanstack/react-start';
import { asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '#/server/db/client';
import { simulatedPlayer } from '#/server/db/schema';

const seedPlayers = [
  ['raven', 'Raven', 'Blade Knight', 400, 98500],
  ['nyx', 'Nyx', 'Soul Master', 400, 94200],
  ['vex', 'Vex', 'Muse Elf', 399, 91100],
  ['kael', 'Kael', 'Magic Gladiator', 398, 88750],
  ['mira', 'Mira', 'Dark Lord', 397, 86100],
  ['sol', 'Sol', 'Blade Knight', 395, 82400],
  ['orin', 'Orin', 'Summoner', 392, 79300],
  ['luna', 'Luna', 'Muse Elf', 388, 75200],
] as const;

const rankingInput = z.object({
  search: z.string().trim().max(80).optional(),
});

export type RankingEntry = {
  rank: number;
  slug: string;
  name: string;
  characterClass: string;
  level: number;
  score: number;
};

async function ensureSeeded() {
  const [existing] = await db
    .select({ id: simulatedPlayer.id })
    .from(simulatedPlayer)
    .limit(1);
  if (existing) return;
  const now = new Date();
  await db.insert(simulatedPlayer).values(
    seedPlayers.map(([publicSlug, name, characterClass, level, score]) => ({
      id: crypto.randomUUID(),
      publicSlug,
      name,
      characterClass,
      level,
      score,
      visibility: 'public',
      updatedAt: now,
    })),
  );
}

function toEntry(player: typeof simulatedPlayer.$inferSelect, rank: number) {
  return {
    rank,
    slug: player.publicSlug,
    name: player.name,
    characterClass: player.characterClass,
    level: player.level,
    score: player.score,
  } satisfies RankingEntry;
}

export const getRanking = createServerFn({ method: 'GET' })
  .validator(rankingInput)
  .handler(async ({ data }): Promise<RankingEntry[]> => {
    await ensureSeeded();
    const players = await db
      .select()
      .from(simulatedPlayer)
      .where(eq(simulatedPlayer.visibility, 'public'))
      .orderBy(
        desc(simulatedPlayer.score),
        desc(simulatedPlayer.level),
        asc(simulatedPlayer.name),
      );
    const normalizedSearch = data.search?.toLowerCase();
    return players
      .map((player, index) => toEntry(player, index + 1))
      .filter(
        (player) =>
          !normalizedSearch ||
          player.name.toLowerCase().includes(normalizedSearch) ||
          player.characterClass.toLowerCase().includes(normalizedSearch),
      );
  });

export const getPublicPlayerProfile = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    await ensureSeeded();
    const [player] = await db
      .select()
      .from(simulatedPlayer)
      .where(eq(simulatedPlayer.publicSlug, data.slug))
      .limit(1);
    if (!player) return null;
    const ranking = await getRanking({ data: {} });
    const entry = ranking.find((item) => item.slug === player.publicSlug);
    return entry
      ? { ...entry, visibility: player.visibility }
      : {
          ...toEntry(player, 0),
          visibility: 'pending',
        };
  });
