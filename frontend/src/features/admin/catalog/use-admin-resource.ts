'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdminSession } from '../AdminSessionProvider';

export function useAdminResource<T>(load: () => Promise<T>) {
  const { execute } = useAdminSession();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(true);
  const generation = useRef(0);
  const invalidate = useCallback(() => { generation.current++; }, []);
  const reload = useCallback(async () => {
    const version = ++generation.current;
    setPending(true); setError(false);
    try { const value = await execute(load); if (version === generation.current) setData(value); }
    catch { if (version === generation.current) setError(true); }
    finally { if (version === generation.current) setPending(false); }
  }, [execute, load]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void reload(); });
    return () => { active = false; invalidate(); };
  }, [reload, invalidate]);
  return { data, setData, error, pending, reload };
}
