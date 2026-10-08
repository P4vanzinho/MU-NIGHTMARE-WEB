import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

type VerificationEmail = { email: string; url: string; sentAt: string };
const outboxFile = resolve(process.cwd(), '.local-data/email-outbox.jsonl');

export async function captureVerificationEmail(
  input: Omit<VerificationEmail, 'sentAt'>,
) {
  const message: VerificationEmail = {
    ...input,
    sentAt: new Date().toISOString(),
  };
  await mkdir(dirname(outboxFile), { recursive: true });
  await appendFile(outboxFile, `${JSON.stringify(message)}\n`);
}
