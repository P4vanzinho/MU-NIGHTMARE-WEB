import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export type CapturedEmail = { email: string; url: string; sentAt: string };
const outboxFile = resolve(process.cwd(), '.local-data/email-outbox.jsonl');

export async function readCapturedEmails(): Promise<CapturedEmail[]> {
  try {
    const content = await readFile(outboxFile, 'utf8');
    return content
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as CapturedEmail);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return [];
    throw error;
  }
}
