import type { Metadata } from 'next';
import { AdminSessionProvider } from '@/features/admin/AdminSessionProvider';

export const metadata: Metadata = { title: 'Quản trị HM Naturals', robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminSessionProvider>{children}</AdminSessionProvider>;
}
