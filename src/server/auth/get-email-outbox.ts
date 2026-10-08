import { createServerFn } from '@tanstack/react-start';

import { readCapturedEmails } from './email-outbox';

export const getEmailOutbox = createServerFn({ method: 'GET' }).handler(() =>
  readCapturedEmails(),
);
