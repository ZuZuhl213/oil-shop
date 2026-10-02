'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/features/admin/LoginForm';
import { useAdminSession } from '@/features/admin/AdminSessionProvider';
import { safeAdminRedirect } from '@/features/admin/auth-api';

function LoginPage() {
  const router = useRouter();
  const query = useSearchParams();
  const { status } = useAdminSession();
  const target = safeAdminRedirect(query.get('next'));
  useEffect(() => { if (status === 'authenticated') router.replace(target); }, [status, target, router]);
  return <main className="flex min-h-dvh items-center justify-center bg-warm-cream p-4">
    <section className="w-full max-w-md rounded-2xl border border-soft-sand bg-white-pure p-6 sm:p-8">
      <p className="section-eyebrow">HM NATURALS · Quản trị</p>
      <h1 className="my-4 text-2xl font-semibold text-forest-green">Đăng nhập quản trị</h1>
      <LoginForm />
      <Link href="/" className="mt-6 inline-block text-sm text-forest-green">← Về cửa hàng</Link>
    </section>
  </main>;
}
export default function Page() { return <Suspense fallback={<p role="status">Đang tải…</p>}><LoginPage /></Suspense>; }
