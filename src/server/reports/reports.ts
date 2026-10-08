import { createServerFn } from '@tanstack/react-start';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  getCurrentSession,
  getRequiredAdminSession,
} from '#/server/auth/session';
import { user } from '#/server/db/auth-schema';
import { db } from '#/server/db/client';
import { adminAuditEvent, bugReport } from '#/server/db/schema';

const reportInput = z.object({
  title: z.string().trim().min(5).max(140),
  steps: z.string().trim().min(10).max(8_000),
  impact: z.string().trim().min(5).max(2_000),
});
const reviewInput = z.object({
  reportId: z.string().min(1),
  status: z.enum(['in_review', 'resolved', 'closed']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  adminNote: z.string().trim().min(3).max(4_000),
  rewardStatus: z.enum(['pending', 'approved', 'denied']),
  rewardReason: z.string().trim().min(3).max(1_000),
});

export type BugReportView = {
  id: string;
  protocol: string;
  title: string;
  steps: string;
  impact: string;
  status: string;
  severity: string | null;
  adminNote: string | null;
  rewardStatus: string;
  rewardReason: string | null;
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
    severity: report.severity,
    adminNote: report.adminNote,
    rewardStatus: report.rewardStatus,
    rewardReason: report.rewardReason,
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

export type AdminBugReport = BugReportView & {
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
};

export const getAdminBugReports = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminBugReport[]> => {
    await getRequiredAdminSession();
    const reports = await db
      .select({
        report: bugReport,
        reporterName: user.name,
        reporterEmail: user.email,
      })
      .from(bugReport)
      .innerJoin(user, eq(bugReport.reporterId, user.id))
      .orderBy(desc(bugReport.createdAt));
    return reports.map(({ report, reporterName, reporterEmail }) => ({
      ...toView(report),
      reporterId: report.reporterId,
      reporterName,
      reporterEmail,
    }));
  },
);

export const reviewBugReport = createServerFn({ method: 'POST' })
  .validator(reviewInput)
  .handler(async ({ data }) => {
    const adminSession = await getRequiredAdminSession();
    const [report] = await db
      .select({ reporterId: bugReport.reporterId })
      .from(bugReport)
      .where(eq(bugReport.id, data.reportId))
      .limit(1);
    if (!report) throw new Error('Report não encontrado.');

    const now = new Date();
    await db
      .update(bugReport)
      .set({
        status: data.status,
        severity: data.severity,
        adminNote: data.adminNote,
        rewardStatus: data.rewardStatus,
        rewardReason: data.rewardReason,
        reviewedBy: adminSession.user.id,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(bugReport.id, data.reportId));

    await db.insert(adminAuditEvent).values({
      id: crypto.randomUUID(),
      actorUserId: adminSession.user.id,
      targetUserId: report.reporterId,
      action: 'bug_report.reviewed',
      reason: data.adminNote,
      createdAt: now,
    });
    return { ok: true };
  });
