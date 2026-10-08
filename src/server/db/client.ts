import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as authSchema from './auth-schema';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://mu:mu@localhost:5432/mu_nightmare';
const client = postgres(connectionString, { max: 5 });

export const db = drizzle(client, { schema: { ...schema, ...authSchema } });
