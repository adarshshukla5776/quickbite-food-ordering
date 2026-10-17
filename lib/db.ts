import { Pool } from 'pg';
const globalForPg = globalThis as unknown as { quickbitePool?: Pool };
export function getPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL. Add it to .env.local or Vercel environment variables.');
  if (!globalForPg.quickbitePool) {
    globalForPg.quickbitePool = new Pool({connectionString:process.env.DATABASE_URL, max:5, idleTimeoutMillis:30000, connectionTimeoutMillis:10000, ssl: {rejectUnauthorized:true}});
  }
  return globalForPg.quickbitePool;
}
