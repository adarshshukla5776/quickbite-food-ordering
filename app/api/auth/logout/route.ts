import {NextRequest,NextResponse} from 'next/server';
import {CUSTOMER_COOKIE,sameOrigin} from '@/lib/customer-auth';
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const response=NextResponse.json({ok:true});response.cookies.set(CUSTOMER_COOKIE,'',{path:'/',maxAge:0,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'});return response;
}
