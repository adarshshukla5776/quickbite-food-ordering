import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'quickbite_admin_session';
export const SESSION_SECONDS = 8 * 60 * 60;

type Session = { email: string; expires: number };

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters.');
  return value;
}
function mac(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}
export function safeEqual(a: string, b: string): boolean {
  const left = createHash('sha256').update(a).digest();
  const right = createHash('sha256').update(b).digest();
  return timingSafeEqual(left, right);
}
export function loginConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12 && process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 32);
}
export function issueSession(email: string): string {
  const payload = Buffer.from(JSON.stringify({ email, expires: Date.now() + SESSION_SECONDS * 1000 })).toString('base64url');
  return `${payload}.${mac(payload)}`;
}
export function verifySession(token?: string): Session | null {
  if (!token) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra || !safeEqual(mac(payload), signature)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Session;
    if (typeof parsed.email !== 'string' || typeof parsed.expires !== 'number' || parsed.expires <= Date.now()) return null;
    if (!process.env.ADMIN_EMAIL || !safeEqual(parsed.email.toLowerCase(), process.env.ADMIN_EMAIL.trim().toLowerCase())) return null;
    return parsed;
  } catch { return null; }
}
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return Boolean(verifySession(store.get(SESSION_COOKIE)?.value));
}
export function allowSameOrigin(request: NextRequest): boolean {
  // For all state-changing cookie-authenticated endpoints.
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}
export function attemptKey(request: NextRequest): string {
  const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  return createHmac('sha256', secret()).update(ip).digest('hex');
}
