import {redirect} from 'next/navigation';
import {currentCustomer} from '@/lib/customer-auth';
import AccountOrders from '@/components/AccountOrders';
export const dynamic='force-dynamic';
export default async function Account(){const user=await currentCustomer();if(!user)redirect('/login');return <AccountOrders name={user.name} email={user.email}/>}
