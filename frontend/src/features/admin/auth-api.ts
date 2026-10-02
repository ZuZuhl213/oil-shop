import { apiFetch, getCsrf, mutationHeaders } from '@/lib/api/client';

export interface AdminProfile { id: string; email: string; name: string }

export function getAdminProfile() { return apiFetch<AdminProfile>('/admin/auth/me'); }
export async function loginAdmin(email: string, password: string) {
  await apiFetch<AdminProfile>('/admin/auth/login', {
    method: 'POST', headers: await mutationHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ email: email.trim(), password }),
  });
  await getCsrf();
  return getAdminProfile();
}
export async function logoutAdmin() {
  await apiFetch<void>('/admin/auth/logout', { method: 'POST', headers: await mutationHeaders() });
}

export function safeAdminRedirect(value: string | null): string {
  if (!value || !/^\/admin(?:\/|$)/.test(value) || /[\\\r\n]/.test(value)) return '/admin/products';
  try {
    const url = new URL(value, 'https://internal.invalid');
    if (url.origin !== 'https://internal.invalid' || !url.pathname.startsWith('/admin/') || url.pathname === '/admin/login') return '/admin/products';
    return url.pathname + url.search;
  } catch { return '/admin/products'; }
}
