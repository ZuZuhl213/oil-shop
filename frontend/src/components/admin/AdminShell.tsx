'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminSession } from '@/features/admin/AdminSessionProvider';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const session = useAdminSession();
  const pathname = usePathname();
  const router = useRouter();
  const [logoutError, setLogoutError] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    if (session.status === 'anonymous' && !session.hasAuthenticated) router.replace('/admin/login?next=' + encodeURIComponent(pathname));
  }, [session.status, session.hasAuthenticated, router, pathname]);

  if (!session.hasAuthenticated) return <main className="min-h-dvh bg-warm-cream p-6">
    {session.status === 'error' ? <><p role="alert">Không kiểm tra được phiên đăng nhập.</p><button className="btn-action-touch fixed-flow mt-4" onClick={() => void session.refresh()}>Thử lại</button></>
      : <p role="status">Đang kiểm tra phiên đăng nhập…</p>}
  </main>;

  return <div className="min-h-dvh bg-warm-cream text-dark-cocoa">
    <header className="border-b border-soft-sand bg-white-pure p-4 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link href="/admin/products" className="font-display text-xl font-semibold text-forest-green">HM NATURALS <span className="text-sm font-body">Quản trị</span></Link>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span>{session.admin?.name}</span><Link href="/">Xem cửa hàng</Link>
          <button disabled={loggingOut} className="min-h-11 rounded-lg border border-soft-sand px-3" onClick={async () => {
            if (loggingOut) return;
            setLoggingOut(true); setLogoutError(false);
            try { await session.logout(); router.replace('/admin/login'); }
            catch { setLogoutError(true); } finally { setLoggingOut(false); }
          }}>{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</button>
        </div>
      </div>
    </header>
    <div className="mx-auto grid max-w-7xl gap-6 p-4 md:grid-cols-[12rem_minmax(0,1fr)] sm:p-8">
      <nav aria-label="Quản trị" className="flex flex-wrap gap-2 md:flex-col">
        {[['categories', 'Danh mục'], ['products', 'Sản phẩm']].map(([path, label]) => <Link key={path} href={'/admin/' + path} aria-current={pathname.startsWith('/admin/' + path) ? 'page' : undefined} className="rounded-xl border border-soft-sand bg-white-pure px-4 py-3 font-medium text-forest-green aria-[current=page]:bg-forest-green aria-[current=page]:text-white-pure">{label}</Link>)}
        <span aria-disabled="true" className="px-4 py-3 text-sm text-text-muted">Đơn hàng · sắp có</span>
        <span aria-disabled="true" className="px-4 py-3 text-sm text-text-muted">Voucher · sắp có</span>
      </nav>
      <main className="min-w-0">
        {logoutError && <p role="alert" className="mb-4 text-error-crimson">Không đăng xuất được. Hãy thử lại.</p>}
        {session.status === 'error' && <div role="alert" className="mb-4 rounded-lg border border-soft-sand p-3">Chưa kiểm tra được phiên. Bản nháp vẫn được giữ. <button onClick={() => void session.refresh()} className="underline">Thử lại</button></div>}
        {children}
      </main>
    </div>
  </div>;
}
