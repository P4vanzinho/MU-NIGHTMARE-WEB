import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

import { auth } from './auth';

export const getCurrentSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders();
    return auth.api.getSession({ headers });
  },
);

export const getRequiredAdminSession = createServerFn({
  method: 'GET',
}).handler(async () => {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  if (session?.user.role !== 'admin')
    throw new Error('Acesso administrativo não autorizado');
  return session;
});
