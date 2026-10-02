import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AdminSessionProvider, useAdminSession } from './AdminSessionProvider';
import { LoginForm } from './LoginForm';
import { apiFetch } from '@/lib/api/client';

afterEach(() => vi.unstubAllGlobals());

const admin = { id: '9223372036854775806', email: 'owner@example.com', name: 'Chủ xưởng' };
function Probe() {
  const session = useAdminSession();
  return <>
    <output>{session.status}</output>
    <output>{session.admin?.name}</output>
    <input aria-label="Bản nháp" defaultValue="Tên đang sửa" />
    <button onClick={() => void session.execute(() => apiFetch('/admin/products')).catch(() => {})}>Lưu thử</button>
    <button onClick={() => void session.logout().catch(() => {})}>Đăng xuất thử</button>
  </>;
}

it('loads me, obtains csrf for login, refreshes csrf/me after login and logs out', async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  let loggedIn = false;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    requests.push({ url, init });
    if (url.endsWith('/csrf')) return Response.json({ token: loggedIn ? 'new-csrf' : 'old-csrf', headerName: 'X-CSRF-TOKEN' });
    if (url.endsWith('/login')) { loggedIn = true; return Response.json(admin); }
    if (url.endsWith('/logout')) { loggedIn = false; return new Response(null, { status: 204 }); }
    return loggedIn ? Response.json(admin) : Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 });
  }));
  render(<AdminSessionProvider><LoginForm /><Probe /></AdminSessionProvider>);
  await screen.findByText('anonymous');
  fireEvent.change(screen.getByLabelText('Email quản trị'), { target: { value: admin.email } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'test-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  await screen.findByText('authenticated');
  expect(screen.getByText(admin.name)).toBeVisible();
  const login = requests.find((entry) => entry.url.endsWith('/login'))!;
  expect(new Headers(login.init?.headers).get('x-csrf-token')).toBe('old-csrf');
  expect(login.init?.credentials).toBe('include');
  expect(requests.map((entry) => entry.url)).toEqual([
    '/api/v1/admin/auth/me', '/api/v1/csrf', '/api/v1/admin/auth/login', '/api/v1/csrf', '/api/v1/admin/auth/me',
  ]);
  fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất thử' }));
  await waitFor(() => expect(screen.getByText('anonymous')).toBeVisible());
  expect(new Headers(requests.find((entry) => entry.url.endsWith('/logout'))!.init?.headers).get('x-csrf-token')).toBe('new-csrf');
  expect(localStorage.getItem('JSESSIONID')).toBeNull();
});

it('shows invalid login errors and does not claim an authenticated session', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('/csrf')
    ? Response.json({ token: 'csrf', headerName: 'X-CSRF-TOKEN' })
    : Response.json({ code: 'UNAUTHENTICATED', message: 'Invalid email or password' }, { status: 401 })));
  render(<AdminSessionProvider><LoginForm /><Probe /></AdminSessionProvider>);
  await screen.findByText('anonymous');
  fireEvent.change(screen.getByLabelText('Email quản trị'), { target: { value: admin.email } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'wrong-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng');
  expect(screen.queryByText('authenticated')).not.toBeInTheDocument();
});

it('prompts for login after a write returns 401 and keeps the edit draft mounted', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('/me') ? Response.json(admin)
    : Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 })));
  render(<AdminSessionProvider><Probe /></AdminSessionProvider>);
  await screen.findByText('authenticated');
  fireEvent.change(screen.getByLabelText('Bản nháp'), { target: { value: 'Chưa lưu' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thử' }));
  expect(await screen.findByRole('dialog', { name: 'Đăng nhập lại' })).toBeVisible();
  expect(screen.getByLabelText('Bản nháp')).toHaveValue('Chưa lưu');
  expect(screen.getByLabelText('Email quản trị')).toHaveFocus();
});

it('keeps recovery open when a focus refresh fails after expiration', async () => {
  let initialMe = true;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/me')) {
      if (initialMe) { initialMe = false; return Response.json(admin); }
      return Response.json({ code: 'SERVICE_UNAVAILABLE' }, { status: 503 });
    }
    return Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 });
  }));
  render(<AdminSessionProvider><Probe /></AdminSessionProvider>);
  await screen.findByText('authenticated');
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thử' }));
  await screen.findByRole('dialog');
  fireEvent.focus(window);
  await waitFor(() => expect(screen.getByText('expired')).toBeVisible());
  expect(screen.getByRole('dialog')).toBeVisible();
});

it('does not let a focus refresh discard a successful pending login', async () => {
  let completeLogin!: () => void;
  let loggedIn = false;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/csrf')) return Response.json({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    if (url.endsWith('/login')) {
      await new Promise<void>((resolve) => { completeLogin = resolve; });
      loggedIn = true; return Response.json(admin);
    }
    return loggedIn ? Response.json(admin) : Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 });
  }));
  render(<AdminSessionProvider><LoginForm /><Probe /></AdminSessionProvider>);
  await screen.findByText('anonymous');
  fireEvent.change(screen.getByLabelText('Email quản trị'), { target: { value: admin.email } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  await waitFor(() => expect(completeLogin).toBeDefined());
  fireEvent.focus(window);
  completeLogin();
  await screen.findByText('authenticated');
});
