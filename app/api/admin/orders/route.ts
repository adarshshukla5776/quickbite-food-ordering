import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const status = request.nextUrl.searchParams.get('status') || 'All';
  if (!['All', 'Placed', 'Preparing', 'On the way', 'Delivered', 'Cancelled'].includes(status)) return NextResponse.json({ error: 'Invalid filter.' }, { status: 400 });
  const page = Number(request.nextUrl.searchParams.get('page') || '1');
  if (!Number.isInteger(page) || page < 1 || page > 10000) return NextResponse.json({ error: 'Invalid page.' }, { status: 400 });
  const search = (request.nextUrl.searchParams.get('search') || '').trim().slice(0, 100);
  try {
    const pool = getPool();
    const where = `WHERE ($1::text='All' OR o.status=$1) AND ($2::text='' OR o.customer_name ILIKE '%' || $2 || '%' OR o.customer_email ILIKE '%' || $2 || '%' OR o.id::text=$2)`;
    const params = [status, search];
    const [count, orders] = await Promise.all([
      pool.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM orders o ${where}`, params),
      pool.query(`SELECT o.id, o.customer_name, o.customer_email, o.customer_phone, o.delivery_address,
        o.total, o.subtotal, o.delivery_fee, o.status, o.created_at,
        COALESCE(json_agg(json_build_object('name', p.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price))
          FILTER (WHERE oi.id IS NOT NULL), '[]'::json) AS items
        FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id
        LEFT JOIN products p ON p.id=oi.product_id
        ${where} GROUP BY o.id ORDER BY o.created_at DESC, o.id DESC LIMIT 20 OFFSET $3`, [...params, (page - 1) * 20]),
    ]);
    return NextResponse.json({ orders: orders.rows, total: count.rows[0].count, page, totalPages: Math.ceil(count.rows[0].count / 20) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { console.error('Admin orders error:', e); return NextResponse.json({ error: 'Could not load orders.' }, { status: 500 }); }
}
