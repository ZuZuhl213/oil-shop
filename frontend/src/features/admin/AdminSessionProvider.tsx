'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ApiClientError, getCsrf } from '@/lib/api/client';
import { useModalDrawer } from '@/lib/use-modal-drawer';
import { getAdminProfile, loginAdmin, logoutAdmin, type AdminProfile } from './auth-api';
import { LoginForm } from './LoginForm';

type SessionState = {
  status: 'checking' | 'authenticated' | 'anonymous' | 'expired' | 'error';
  admin: AdminProfile | null;
  hasAuthenticated: boolean;
};
interface SessionContext extends SessionState {
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  execute: <T>(operation: () => Promise<T>) => Promise<T>;
}
const Context = createContext<SessionContext | null>(null);
const initial: SessionState = { status: 'checking', admin: null, hasAuthenticated: false };
const keepOpen = () => {};

function SessionRecovery({ open }: { open: boolean }) {
  const { panelRef } = useModalDrawer(open, keepOpen);
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4">
    <aside ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Đăng nhập lại" className="w-full max-w-md rounded-2xl bg-warm-cream p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-forest-green">Phiên đăng nhập đã hết hạn</h2>
      <p className="my-3 text-sm text-text-muted">Bản nháp vẫn được giữ tại trang này. Đăng nhập lại, kiểm tra rồi lưu khi bạn sẵn sàng.</p>
      <LoginForm />
    </aside>
  </div>;
}

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>(initial);
  const generation = useRef(0);
  const loggingIn = useRef(false);
  const invalidate = useCallback(() => { generation.current++; }, []);

  const refresh = useCallback(async () => {
    if (loggingIn.current) return;
    const version = ++generation.current;
    try {
      const admin = await getAdminProfile();
      if (version === generation.current) setState({ status: 'authenticated', admin, hasAuthenticated: true });
    } catch (error) {
      if (version !== generation.current) return;
      setState((current) => ({ ...current, status: error instanceof ApiClientError && error.status === 401
        ? (current.hasAuthenticated ? 'expired' : 'anonymous') : current.status === 'expired' ? 'expired' : 'error' }));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => { invalidate(); window.removeEventListener('focus', onFocus); };
  }, [refresh, invalidate]);

  const login = useCallback(async (email: string, password: string) => {
    const version = ++generation.current;
    loggingIn.current = true;
    try {
      const admin = await loginAdmin(email, password);
      if (version === generation.current) setState({ status: 'authenticated', admin, hasAuthenticated: true });
    } finally { loggingIn.current = false; }
  }, []);

  const execute = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    try { return await operation(); }
    catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        generation.current++;
        setState((current) => ({ ...current, status: current.hasAuthenticated ? 'expired' : 'anonymous' }));
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await execute(logoutAdmin);
    generation.current++;
    setState({ status: 'anonymous', admin: null, hasAuthenticated: false });
    // The session is already invalidated; a failed refresh must not undo logout.
    await getCsrf().catch(() => {});
  }, [execute]);

  return <Context.Provider value={{ ...state, refresh, login, logout, execute }}>
    <div className="contents" inert={state.status === 'expired'}>{children}</div>
    <SessionRecovery open={state.status === 'expired'} />
  </Context.Provider>;
}

export function useAdminSession() {
  const session = useContext(Context);
  if (!session) throw new Error('AdminSessionProvider is required');
  return session;
}
