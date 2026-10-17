import {NextResponse} from 'next/server';
import {currentCustomer} from '@/lib/customer-auth';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json({customer:await currentCustomer()},{headers:{'Cache-Control':'no-store'}})}catch(e){console.error('Customer session lookup failed',e);return NextResponse.json({error:'Unable to load session.'},{status:500})}}
