'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiClientError } from '@/lib/api/client';
import { useAdminSession } from '../AdminSessionProvider';

export const fieldClass = 'mt-1 min-h-11 min-w-0 max-w-full w-full rounded-lg border border-soft-sand bg-white-pure px-3 py-2 text-dark-cocoa focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-green disabled:opacity-60';
export const formClass = 'space-y-4 rounded-2xl border border-soft-sand bg-white-pure p-4 sm:p-6';
export const actionClass = 'min-h-11 rounded-lg border border-soft-sand px-4 py-2 text-sm font-medium text-forest-green disabled:opacity-50';

export function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Bản nháp vẫn được giữ; đăng nhập lại rồi lưu.';
    if (error.status === 409) return 'Slug hoặc SKU đã tồn tại. Kiểm tra lại thông tin; bản nháp vẫn được giữ.';
    if (error.status === 403) return 'Yêu cầu chưa được cho phép. Hãy kiểm tra phiên rồi thử lại.';
    if (error.status === 422) return error.message || 'Thông tin không hợp lệ.';
  }
  return 'Không lưu được. Kiểm tra kết nối và thử lại; bản nháp vẫn được giữ.';
}

export function useAdminMutation(describeError: (error: unknown) => string = errorMessage) {
  const { execute } = useAdminSession();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ message: string; fields: Record<string, string> } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const run = async <T,>(operation: () => Promise<T>, onSaved: (value: T) => void, success = 'Đã lưu thành công.') => {
    if (busy.current) return false;
    busy.current = true; setPending(true); setError(null); setMessage(null);
    try {
      const result = await execute(operation);
      onSaved(result); setMessage(success); return true;
    } catch (failure) {
      setError({ message: describeError(failure), fields: failure instanceof ApiClientError ? failure.fieldErrors : {} });
      return false;
    } finally { busy.current = false; setPending(false); }
  };
  return { pending, error, message, run };
}

export function FormFeedback({ mutation, prefix }: { mutation: ReturnType<typeof useAdminMutation>; prefix: string }) {
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => { if (mutation.error) summary.current?.focus(); }, [mutation.error]);
  return <>
    {mutation.error && <div ref={summary} tabIndex={-1} role="alert" className="rounded-lg border border-error-crimson p-3 text-sm text-error-crimson">
      <p>{mutation.error.message}</p>
      {Object.entries(mutation.error.fields).length > 0 && <ul className="mt-2 list-inside list-disc">{Object.entries(mutation.error.fields).map(([field, message]) => <li key={field}><a href={`#${prefix}-${field}`} className="underline">{message}</a></li>)}</ul>}
    </div>}
    {mutation.message && <p role="status" className="rounded-lg border border-soft-sand p-3 text-sm text-forest-green">{mutation.message}</p>}
  </>;
}

export function TextField({ label, name, value, onChange, prefix, errors, type = 'text', required = false, maxLength, min, step }: {
  label: string; name: string; value: string; onChange: (value: string) => void; prefix: string;
  errors?: Record<string, string>; type?: 'text' | 'url' | 'number' | 'textarea' | 'datetime-local'; required?: boolean; maxLength?: number; min?: number; step?: string;
}) {
  const id = `${prefix}-${name}`;
  const props = { id, value, required, maxLength, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value), className: fieldClass, 'aria-invalid': errors?.[name] ? true : undefined, 'aria-describedby': errors?.[name] ? id + '-error' : undefined };
  return <div><label htmlFor={id} className="text-sm font-medium text-forest-green">{label}</label>
    {type === 'textarea' ? <textarea {...props} rows={4} /> : <input {...props} type={type} min={min} step={step} />}
    {errors?.[name] && <p id={id + '-error'} className="mt-1 text-sm text-error-crimson">{errors[name]}</p>}
  </div>;
}

export function optionalText(value: string): string | null { return value.trim() || null; }
export function sortOrder(value: string): number {
  const number = Number(value);
  if (!/^-?\d+$/.test(value) || !Number.isInteger(number) || number < -2147483648 || number > 2147483647) {
    throw new ApiClientError(422, { message: 'Thứ tự phải là số nguyên hợp lệ.', fieldErrors: { sortOrder: 'Nhập số nguyên trong khoảng INT32.' } });
  }
  return number;
}
