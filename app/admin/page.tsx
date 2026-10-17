import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin-auth';
import AdminDashboard from './AdminDashboard';
export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/admin/login');
  return <AdminDashboard />;
}
