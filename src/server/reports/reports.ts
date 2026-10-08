import { createServerFn } from '@tanstack/react-start';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { getCurrentSession } from '#/server/auth/session';
import { db } from '#/server/db/client';
import { bugReport } from '#/server/db/schema';

const reportInput = z.object({
  title: z.string().trim().min(5).max(140),
  steps: z.string().trim().min(10).max(8_000),
  impact: z.string().trim().min(5).max(2_000),
});

export type BugReportView = {
  id: string;
  protocol: string;
  title: string;
  steps: string;
  impact: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function toView(report: typeof bugReport.$inferSelect): BugReportView {
  return {
    id: report.id,
    protocol: report.protocol,
    title: report.title,
    steps: report.steps,
    impact: report.impact,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export const getMyBugReports = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BugReportView[]> => {
    const session = await getCurrentSession();
    if (!session) return [];
    const reports = await db
      .select()
      .from(bugReport)
      .where(eq(bugReport.reporterId, session.user.id))
      .orderBy(desc(bugReport.createdAt));
    return reports.map(toView);
  },
);

export const createBugReport = createServerFn({ method: 'POST' })
  .validator(reportInput)
  .handler(async ({ data }) => {
    const session = await getCurrentSession();
    if (!session) throw new Error('Entre para enviar um report.');
    const now = new Date();
    const protocol = `NM-${now.toISOString().slice(0, 10).replaceAll('-', '')}-${crypto
      .randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;
    const [report] = await db
      .insert(bugReport)
      .values({
        id: crypto.randomUUID(),
        protocol,
        reporterId: session.user.id,
        title: data.title,
        steps: data.steps,
        impact: data.impact,
        status: 'submitted',
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return toView(report);
  });
