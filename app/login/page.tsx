import {redirect} from 'next/navigation';
import {currentCustomer} from '@/lib/customer-auth';
import CustomerAuthForm from '@/components/CustomerAuthForm';
export const dynamic='force-dynamic';
export default async function Login(){if(await currentCustomer())redirect('/account');return <CustomerAuthForm mode="login"/>}
