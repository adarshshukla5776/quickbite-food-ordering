import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';

const scrypt = promisify(scryptCallback);
export const CUSTOMER_COOKIE = 'quickbite_customer_session';
export const CUSTOMER_SESSION_SECONDS = 7 * 24 * 60 * 60;
export type Customer = {id: number; name: string; email: string};

function signingSecret(): string {
  const value = process.env.CUSTOMER_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('CUSTOMER_SESSION_SECRET must contain at least 32 characters.');
  return value;
}
export function customerAuthConfigured(): boolean {
  return Boolean(process.env.CUSTOMER_SESSION_SECRET && process.env.CUSTOMER_SESSION_SECRET.length >= 32);
}
export function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString('hex')}`;
}
export async function checkPassword(password: string, stored: string): Promise<boolean> {
  const [method,salt,hex,extra] = stored.split('$');
  if (method !== 'scrypt' || !/^[a-f\d]{32}$/.test(salt ?? '') || !/^[a-f\d]{128}$/.test(hex ?? '') || extra) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hex, 'hex');
  return timingSafeEqual(actual, expected);
}
function sign(payload: string) {
  return createHmac('sha256', signingSecret()).update(payload).digest('base64url');
}
export function makeCustomerSession(id: number): string {
  const payload = Buffer.from(JSON.stringify({id,exp:Date.now()+CUSTOMER_SESSION_SECONDS*1000})).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
function decodeCustomerSession(token?: string): number | null {
  if (!token || !customerAuthConfigured()) return null;
  const [payload,mac,extra] = token.split('.');
  if (!payload || !mac || extra) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(mac);
  if (actual.length !== expected.length || !timingSafeEqual(actual,expected)) return null;
  try {
    const obj = JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
    return Number.isSafeInteger(obj.id) && obj.id>0 && typeof obj.exp==='number' && obj.exp>Date.now() ? obj.id : null;
  } catch { return null; }
}
export async function currentCustomer(): Promise<Customer | null> {
  const store = await cookies();
  const id = decodeCustomerSession(store.get(CUSTOMER_COOKIE)?.value);
  if (!id) return null;
  const result = await getPool().query<Customer>('SELECT id,name,email FROM customers WHERE id=$1',[id]);
  return result.rows[0] ?? null;
}
export function customerAttemptKey(request: NextRequest, email: string): string {
  const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  return createHmac('sha256',signingSecret()).update(`${ip}|${email}`).digest('hex');
}
export function customerCookieOptions() {
  return {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:CUSTOMER_SESSION_SECONDS};
}
