import { createServerFn } from '@tanstack/react-start';
import { asc } from 'drizzle-orm';

import { db } from '#/server/db/client';
import { simulatedEvent } from '#/server/db/schema';

export type SimulatedEvent = {
  id: string;
  slug: string;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  multiplier: number | null;
};

async function ensureEvents() {
  const [existing] = await db
    .select({ id: simulatedEvent.id })
    .from(simulatedEvent)
    .limit(1);
  if (existing) return;
  const now = Date.now();
  const events = [
    [
      'blood-castle',
      'Blood Castle',
      'Monstros mais agressivos e recompensas ampliadas.',
      60,
      3,
    ],
    [
      'devil-square',
      'Devil Square',
      'Entrada especial aberta para todos os níveis.',
      180,
      2,
    ],
    [
      'golden-invasion',
      'Invasão Dourada',
      'Caçada aos invasores com drop especial.',
      360,
      4,
    ],
  ] as const;
  await db.insert(simulatedEvent).values(
    events.map(([slug, name, description, startsInMinutes, multiplier]) => ({
      id: crypto.randomUUID(),
      slug,
      name,
      description,
      startsAt: new Date(now + startsInMinutes * 60_000),
      endsAt: new Date(now + (startsInMinutes + 45) * 60_000),
      multiplier,
    })),
  );
}

export const getSimulatedEvents = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SimulatedEvent[]> => {
    await ensureEvents();
    const events = await db
      .select()
      .from(simulatedEvent)
      .orderBy(asc(simulatedEvent.startsAt));
    return events.map((event) => ({
      ...event,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
    }));
  },
);
