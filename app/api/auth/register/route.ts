import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { CUSTOMER_COOKIE, customerAuthConfigured, customerAttemptKey, customerCookieOptions, hashPassword, makeCustomerSession, sameOrigin } from '@/lib/customer-auth';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  if(!sameOrigin(req)) return NextResponse.json({error:'Invalid request origin.'},{status:403});
  if(!customerAuthConfigured()) return NextResponse.json({error:'Customer login has not been configured.'},{status:503});
  let body: {name?:unknown;email?:unknown;password?:unknown};
  try { body=await req.json(); } catch { return NextResponse.json({error:'Invalid request.'},{status:400}); }
  const {name,email,password}=body;
  if(typeof name!=='string'||name.trim().length<2||name.trim().length>100||typeof email!=='string'||email.trim().length>200||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())||typeof password!=='string'||password.length<12||password.length>128) return NextResponse.json({error:'Enter a valid name, email and password (minimum 12 characters).'},{status:400});
  const normalized=email.trim().toLowerCase();
  try {
    const pool=getPool();
    const attemptKey=customerAttemptKey(req,'registration');
    const {rows:attempts}=await pool.query<{count:string}>(`SELECT COUNT(*)::text AS count FROM customer_auth_attempts WHERE key_hash=$1 AND attempted_at>NOW()-INTERVAL '1 hour'`,[attemptKey]);
    if(Number(attempts[0].count)>=8) return NextResponse.json({error:'Too many registration attempts. Please try later.'},{status:429});
    await pool.query(`INSERT INTO customer_auth_attempts(key_hash) VALUES($1)`,[attemptKey]);
    const hash=await hashPassword(password);
    const result=await pool.query<{id:number}>(`INSERT INTO customers(name,email,password_hash) VALUES($1,$2,$3) RETURNING id`,[name.trim(),normalized,hash]);
    const response=NextResponse.json({ok:true},{status:201,headers:{'Cache-Control':'no-store'}});
    response.cookies.set(CUSTOMER_COOKIE,makeCustomerSession(result.rows[0].id),customerCookieOptions());
    return response;
  } catch(err) {
    if((err as {code?:string}).code==='23505') return NextResponse.json({error:'An account already exists for this email. Please sign in.'},{status:409});
    console.error('Customer registration error',err);
    return NextResponse.json({error:'Registration failed. Check customer-migration.sql in Neon.'},{status:500});
  }
}
