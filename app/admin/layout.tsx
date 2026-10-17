import './admin.css';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Operator Console | QuickBite',
  description: 'Private QuickBite operator workspace for demo orders.',
  robots: { index: false, follow: false },
};
export default function AdminLayout({children}:{children:React.ReactNode}) {
  return <>{children}</>;
}
