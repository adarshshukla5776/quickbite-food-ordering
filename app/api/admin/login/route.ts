import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { allowSameOrigin, attemptKey, issueSession, loginConfigured, safeEqual, SESSION_COOKIE, SESSION_SECONDS } from '@/lib/admin-auth';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!allowSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (!loginConfigured()) return NextResponse.json({ error: 'Admin is not configured. Check README and .env.local.' }, { status: 503 });
  let body: { email?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (typeof body.email !== 'string' || typeof body.password !== 'string' || body.email.length > 254 || body.password.length > 256) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }
  const key = attemptKey(request);
  try {
    const pool = getPool();
    const attempts = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM admin_login_attempts WHERE key_hash=$1 AND attempted_at > NOW() - INTERVAL '15 minutes'`, [key]);
    if (Number(attempts.rows[0].count) >= 5) return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
    const email = process.env.ADMIN_EMAIL!.trim().toLowerCase();
    const valid = safeEqual(body.email.trim().toLowerCase(), email) && safeEqual(body.password, process.env.ADMIN_PASSWORD!);
    if (!valid) {
      await pool.query('INSERT INTO admin_login_attempts(key_hash) VALUES($1)', [key]);
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }
    await pool.query('DELETE FROM admin_login_attempts WHERE key_hash=$1', [key]);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, issueSession(email), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: SESSION_SECONDS,
    });
    return response;
  } catch (error) {
    console.error('Admin login database error:', error);
    return NextResponse.json({ error: 'Could not sign in. Run database/admin-migration.sql in Neon.' }, { status: 500 });
  }
}
