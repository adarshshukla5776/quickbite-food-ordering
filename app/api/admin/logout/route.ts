import { NextRequest, NextResponse } from 'next/server';
import { allowSameOrigin, SESSION_COOKIE } from '@/lib/admin-auth';
export async function POST(request: NextRequest) {
  if (!allowSameOrigin(request)) return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
  return response;
}
