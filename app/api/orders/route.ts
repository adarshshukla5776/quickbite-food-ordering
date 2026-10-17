import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { currentCustomer } from '@/lib/customer-auth';
export const dynamic='force-dynamic';
type CartItem = {productId:number;quantity:number};
export async function POST(request:NextRequest) {
 let body: {name?:unknown;email?:unknown;phone?:unknown;address?:unknown;items?:unknown};
 try {body=await request.json();}catch {return NextResponse.json({error:'Invalid JSON'},{status:400});}
 const {name,email,phone,address,items}=body;
 // Guest checkout stays supported; authenticated orders are linked to the signed-in customer.
 const customer = await currentCustomer();
 if (typeof name!=='string'||name.trim().length<2||name.length>100||typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||email.length>200||typeof phone!=='string'||!/^\+?[0-9\s-]{8,18}$/.test(phone)||typeof address!=='string'||address.trim().length<8||address.length>500||!Array.isArray(items)||items.length<1||items.length>30) return NextResponse.json({error:'Please enter valid delivery details and cart items.'},{status:400});
 const cart=items as CartItem[];
 if (cart.some(x=>!x||!Number.isSafeInteger(x.productId)||x.productId<=0||!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>20) || new Set(cart.map(x=>x.productId)).size!==cart.length) return NextResponse.json({error:'Invalid cart quantities.'},{status:400});
 const client=await getPool().connect();
 try {
  await client.query('BEGIN');
  const ids=cart.map(x=>x.productId);
  const {rows}=await client.query<{id:number;price:number}>(`SELECT id,price FROM products WHERE id = ANY($1::int[]) AND available = TRUE`,[ids]);
  if(rows.length!==cart.length) {await client.query('ROLLBACK');return NextResponse.json({error:'Some items are no longer available.'},{status:400});}
  const prices=new Map(rows.map(p=>[p.id,p.price]));
  const subtotal=cart.reduce((s,item)=>s+(prices.get(item.productId)??0)*item.quantity,0);
  const deliveryFee=subtotal>=499?0:49;
  const result=await client.query<{id:number}>(`INSERT INTO orders(customer_name,customer_email,customer_phone,delivery_address,subtotal,delivery_fee,total,customer_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,[name.trim(),customer ? customer.email : email.trim().toLowerCase(),phone.trim(),address.trim(),subtotal,deliveryFee,subtotal+deliveryFee,customer?.id ?? null]);
  const orderId=result.rows[0].id;
  for(const item of cart) await client.query(`INSERT INTO order_items(order_id,product_id,quantity,unit_price) VALUES($1,$2,$3,$4)`,[orderId,item.productId,item.quantity,prices.get(item.productId)]);
  await client.query('COMMIT');
  return NextResponse.json({orderId,total:subtotal+deliveryFee},{status:201});
 } catch(e) {await client.query('ROLLBACK');console.error(e);return NextResponse.json({error:'Unable to place order.'},{status:500});}finally{client.release();}
}
export async function GET(request:NextRequest) {
 const email=request.nextUrl.searchParams.get('email')?.trim().toLowerCase();
 const orderId=request.nextUrl.searchParams.get('orderId');
 if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!orderId||!/^\d+$/.test(orderId)) return NextResponse.json({error:'Enter a valid order number and checkout email.'},{status:400});
 try {
  const {rows}=await getPool().query(`SELECT o.id,o.customer_name,o.total,o.status,o.created_at,
   COALESCE(json_agg(json_build_object('name',p.name,'quantity',oi.quantity,'unit_price',oi.unit_price)) FILTER (WHERE oi.id IS NOT NULL),'[]'::json) AS items
   FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN products p ON p.id=oi.product_id
   WHERE o.customer_email=$1 AND o.id=$2 GROUP BY o.id`,[email,orderId]);
  return NextResponse.json({orders:rows},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return NextResponse.json({error:'Unable to load order.'},{status:500});}
}
