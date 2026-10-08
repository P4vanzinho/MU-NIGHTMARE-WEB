import { createServerFn } from '@tanstack/react-start';
import { desc } from 'drizzle-orm';
import { getRequiredAdminSession } from '#/server/auth/session';
import { db } from '#/server/db/client';
import { operationLog } from '#/server/db/schema';
import { readOpenMuHealth } from '#/server/integrations/openmu/health';

export const getOperationsOverview = createServerFn({ method: 'GET' }).handler(
  async () => {
    await getRequiredAdminSession();
    const [openmu, logs] = await Promise.all([
      readOpenMuHealth(),
      db
        .select()
        .from(operationLog)
        .orderBy(desc(operationLog.createdAt))
        .limit(20),
    ]);
    return { openmu, logs };
  },
);
