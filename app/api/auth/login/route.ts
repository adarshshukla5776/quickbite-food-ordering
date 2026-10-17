import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { CUSTOMER_COOKIE,checkPassword,customerAuthConfigured,customerAttemptKey,customerCookieOptions,makeCustomerSession,sameOrigin } from '@/lib/customer-auth';
export const dynamic = 'force-dynamic';
export async function POST(req:NextRequest){
 if(!sameOrigin(req)) return NextResponse.json({error:'Invalid request origin.'},{status:403});
 if(!customerAuthConfigured()) return NextResponse.json({error:'Customer login has not been configured.'},{status:503});
 let body: {email?:unknown;password?:unknown};try{body=await req.json()}catch{return NextResponse.json({error:'Invalid request.'},{status:400})}
 if(typeof body.email!=='string'||typeof body.password!=='string'||body.email.length>200||body.password.length>128)return NextResponse.json({error:'Invalid email or password.'},{status:401});
 const email=body.email.trim().toLowerCase();const key=customerAttemptKey(req,email);
 try {
  const pool=getPool();
  const attempts=await pool.query<{count:string}>(`SELECT COUNT(*)::text AS count FROM customer_auth_attempts WHERE key_hash=$1 AND attempted_at>NOW()-INTERVAL '15 minutes'`,[key]);
  if(Number(attempts.rows[0].count)>=6)return NextResponse.json({error:'Too many attempts. Try again in 15 minutes.'},{status:429});
  const user=await pool.query<{id:number;password_hash:string}>(`SELECT id,password_hash FROM customers WHERE email=$1`,[email]);
  const valid=user.rows.length && await checkPassword(body.password,user.rows[0].password_hash);
  if(!valid){await pool.query(`INSERT INTO customer_auth_attempts(key_hash) VALUES($1)`,[key]);return NextResponse.json({error:'Invalid email or password.'},{status:401})}
  await pool.query(`DELETE FROM customer_auth_attempts WHERE key_hash=$1`,[key]);
  const response=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  response.cookies.set(CUSTOMER_COOKIE,makeCustomerSession(user.rows[0].id),customerCookieOptions());return response;
 }catch(e){console.error('Customer login error',e);return NextResponse.json({error:'Login failed. Check Neon migration and configuration.'},{status:500});}
}
