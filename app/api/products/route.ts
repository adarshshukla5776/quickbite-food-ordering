import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET() {
 try {
  const {rows}=await getPool().query(`SELECT p.id,p.name,p.description,p.price,p.image_url,p.rating,p.badge,c.name AS category FROM products p JOIN categories c ON c.id=p.category_id WHERE p.available=TRUE ORDER BY p.id`);
  return NextResponse.json({products:rows});
 } catch(e) { console.error(e);return NextResponse.json({error:'Unable to load menu. Check database setup.'},{status:500}); }
}
