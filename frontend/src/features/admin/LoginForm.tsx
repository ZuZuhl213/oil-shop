'use client';

import { useRef, useState } from 'react';
import { ApiClientError } from '@/lib/api/client';
import { useAdminSession } from './AdminSessionProvider';

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAdminSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  return <form onSubmit={async (event) => {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setPending(true); setError(null);
    try { await login(email, password); setPassword(''); onSuccess?.(); }
    catch (failure) {
      setError(failure instanceof ApiClientError && failure.status === 401
        ? 'Email hoặc mật khẩu không đúng.' : 'Không đăng nhập được. Kiểm tra kết nối rồi thử lại.');
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { busy.current = false; setPending(false); }
  }} className="space-y-4">
    {error && <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-lg border border-error-crimson p-3 text-sm text-error-crimson">{error}</p>}
    <label className="block text-sm font-medium text-forest-green">Email quản trị
      <input type="email" required autoComplete="username" value={email} disabled={pending} onChange={(event) => setEmail(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-soft-sand bg-white-pure px-3 text-dark-cocoa" />
    </label>
    <label className="block text-sm font-medium text-forest-green">Mật khẩu
      <input type="password" required autoComplete="current-password" value={password} disabled={pending} onChange={(event) => setPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-soft-sand bg-white-pure px-3 text-dark-cocoa" />
    </label>
    <button disabled={pending} type="submit" className="btn-action-touch fixed-flow w-full disabled:opacity-50">{pending ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
  </form>;
}
