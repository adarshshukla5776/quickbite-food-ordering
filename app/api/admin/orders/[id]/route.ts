import { NextRequest, NextResponse } from 'next/server';
import { allowSameOrigin, isAdmin } from '@/lib/admin-auth';
import { getPool } from '@/lib/db';
export const dynamic = 'force-dynamic';
const transitions: Record<string, string[]> = {
  'Placed': ['Preparing', 'Cancelled'],
  'Preparing': ['On the way', 'Cancelled'],
  'On the way': ['Delivered', 'Cancelled'],
  'Delivered': [], 'Cancelled': [],
};
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid order number.' }, { status: 400 });
  let body: { status?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (typeof body.status !== 'string' || !['Preparing', 'On the way', 'Delivered', 'Cancelled'].includes(body.status)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query<{ status: string }>('SELECT status FROM orders WHERE id=$1 FOR UPDATE', [id]);
    if (!existing.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Order not found.' }, { status: 404 }); }
    if (!transitions[existing.rows[0].status]?.includes(body.status)) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Invalid status change. Refresh orders.' }, { status: 409 }); }
    const result = await client.query('UPDATE orders SET status=$1 WHERE id=$2 RETURNING id, status', [body.status, id]);
    await client.query('COMMIT');
    return NextResponse.json({ order: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK'); console.error('Update status error:', error);
    return NextResponse.json({ error: 'Could not update order.' }, { status: 500 });
  } finally { client.release(); }
}
