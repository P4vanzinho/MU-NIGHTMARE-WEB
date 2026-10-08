import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export type NewsPreview = {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
};
type SiteSettings = { news: NewsPreview[] };
const dataFile = resolve(process.cwd(), '.local-data/site-settings.json');
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
  try {
    return JSON.parse(await readFile(dataFile, 'utf8')) as SiteSettings;
  } catch (error) {
    if (!isMissingFile(error)) throw error;
    await mkdir(dirname(dataFile), { recursive: true });
    await writeFile(dataFile, `${JSON.stringify(defaultSettings, null, 2)}\n`);
    return defaultSettings;
  }
}
function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
