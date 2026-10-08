import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import * as authSchema from '../db/auth-schema';
import { db } from '../db/client';
import {
  capturePasswordResetEmail,
  captureVerificationEmail,
} from './email-capture';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await capturePasswordResetEmail({ email: user.email, url });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await captureVerificationEmail({ email: user.email, url });
    },
  },
  secret:
    process.env.BETTER_AUTH_SECRET ?? 'local-development-secret-change-me',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  plugins: [
    admin({ defaultRole: 'player', adminRoles: ['admin'] }),
    tanstackStartCookies(),
  ],
});
