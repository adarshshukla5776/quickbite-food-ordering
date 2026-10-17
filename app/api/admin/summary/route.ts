import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { getPool } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const pool = getPool();
    const [stats, daily] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total_orders,
        COUNT(*) FILTER (WHERE status='Placed')::int AS pending,
        COUNT(*) FILTER (WHERE status='Preparing')::int AS preparing,
        COUNT(*) FILTER (WHERE status='On the way')::int AS on_the_way,
        COUNT(*) FILTER (WHERE status='Delivered')::int AS delivered,
        COUNT(*) FILTER (WHERE status='Cancelled')::int AS cancelled,
        COALESCE(SUM(total) FILTER (WHERE status <> 'Cancelled'),0)::int AS total_sales,
        COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date=(NOW() AT TIME ZONE 'Asia/Kolkata')::date)::int AS today_orders
        FROM orders`),
      pool.query(`SELECT TO_CHAR(days.day,'YYYY-MM-DD') AS day, COUNT(o.id)::int AS orders,
        COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'Cancelled'),0)::int AS sales
        FROM GENERATE_SERIES((NOW() AT TIME ZONE 'Asia/Kolkata')::date - INTERVAL '6 days', (NOW() AT TIME ZONE 'Asia/Kolkata')::date, '1 day') AS days(day)
        LEFT JOIN orders o ON (o.created_at AT TIME ZONE 'Asia/Kolkata')::date=days.day::date
        GROUP BY days.day ORDER BY days.day`),
    ]);
    return NextResponse.json({ stats: stats.rows[0], daily: daily.rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { console.error('Admin stats error:', e); return NextResponse.json({ error: 'Could not load analytics.' }, { status: 500 }); }
}
