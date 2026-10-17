import { NextRequest,NextResponse } from 'next/server';
import {getPool} from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const email=request.nextUrl.searchParams.get('email')?.toLowerCase().trim();
 if(!/^\d+$/.test(id)||!email) return NextResponse.json({error:'Valid order number and email required.'},{status:400});
 try {const {rows}=await getPool().query('SELECT id,status,total,created_at FROM orders WHERE id=$1 AND customer_email=$2',[id,email]);return rows[0]?NextResponse.json(rows[0]):NextResponse.json({error:'Order not found.'},{status:404});}
 catch(e){console.error(e);return NextResponse.json({error:'Unable to find order.'},{status:500});}
}
