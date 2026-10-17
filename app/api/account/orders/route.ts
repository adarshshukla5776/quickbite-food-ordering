import {NextResponse} from 'next/server';
import {currentCustomer} from '@/lib/customer-auth';
import {getPool} from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(){
 try {
  const customer=await currentCustomer();if(!customer)return NextResponse.json({error:'Please sign in.'},{status:401});
  const {rows}=await getPool().query(`SELECT o.id,o.total,o.status,o.created_at,
   COALESCE(json_agg(json_build_object('name',p.name,'quantity',oi.quantity,'unit_price',oi.unit_price)) FILTER(WHERE oi.id IS NOT NULL),'[]'::json) AS items
   FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN products p ON p.id=oi.product_id
   WHERE o.customer_id=$1 GROUP BY o.id ORDER BY o.created_at DESC LIMIT 30`,[customer.id]);
  return NextResponse.json({orders:rows},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Account order history error',e);return NextResponse.json({error:'Unable to load orders.'},{status:500});}
}
