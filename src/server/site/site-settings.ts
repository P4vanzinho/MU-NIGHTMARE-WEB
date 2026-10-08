import { eq } from 'drizzle-orm';

import { db } from '../db/client';
import { siteSettings } from '../db/schema';

export type NewsPreview = {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
};

type SiteSettings = { news: NewsPreview[] };

const defaultSettings: SiteSettings = {
  news: [
    {
      id: 'welcome',
      title: 'Bem-vindo ao novo Nightmare',
      category: 'Servidor',
      publishedAt: '2026-10-07T12:00:00.000Z',
    },
    {
      id: 'season',
      title: 'A próxima temporada começa em breve',
      category: 'Eventos',
      publishedAt: '2026-10-05T12:00:00.000Z',
    },
  ],
};

export async function readSiteSettings(): Promise<SiteSettings> {
  await db
    .insert(siteSettings)
    .values({ id: 'portal', news: defaultSettings.news, updatedAt: new Date() })
    .onConflictDoNothing();
  const [settings] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 'portal'))
    .limit(1);

  if (!settings)
    throw new Error(
      'Configuração do portal não encontrada após a inicialização',
    );
  return { news: settings.news as NewsPreview[] };
}
