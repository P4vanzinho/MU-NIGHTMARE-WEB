import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export type CapturedEmail = {
  type: 'verification' | 'password-reset';
  email: string;
  url: string;
  sentAt: string;
};

const outboxFile = resolve(process.cwd(), '.local-data/email-outbox.jsonl');

export async function captureVerificationEmail(
  input: Omit<CapturedEmail, 'sentAt' | 'type'>,
) {
  await captureEmail({ ...input, type: 'verification' });
}

export async function capturePasswordResetEmail(
  input: Omit<CapturedEmail, 'sentAt' | 'type'>,
) {
  await captureEmail({ ...input, type: 'password-reset' });
}

async function captureEmail(input: Omit<CapturedEmail, 'sentAt'>) {
  const message: CapturedEmail = { ...input, sentAt: new Date().toISOString() };
  await mkdir(dirname(outboxFile), { recursive: true });
  await appendFile(outboxFile, `${JSON.stringify(message)}\n`);
}
