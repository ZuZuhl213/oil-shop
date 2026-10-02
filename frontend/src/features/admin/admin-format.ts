import { ApiClientError } from '@/lib/api/client';

export const vietnamTimeZone = 'Asia/Ho_Chi_Minh';
export function localVietnam(instant: string | null): string {
  if (!instant) return '';
  const date = new Date(instant);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: vietnamTimeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const part = (name: string) => parts.find((entry) => entry.type === name)?.value;
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}
export function vietnamInstant(value: string, field: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || value.startsWith('0000')) throw invalid(field, 'Nhập thời gian hợp lệ theo giờ Việt Nam.');
  const date = new Date(value + ':00+07:00');
  if (!Number.isFinite(date.getTime()) || localVietnam(date.toISOString()) !== value) throw invalid(field, 'Nhập thời gian hợp lệ theo giờ Việt Nam.');
  return date.toISOString();
}
export function invalid(field: string, message: string) { return new ApiClientError(422, { code: 'VALIDATION_ERROR', message, fieldErrors: { [field]: message } }); }
export function integer(value: string, field: string, label: string, min: number, max: number): number {
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < min || number > max) throw invalid(field, `${label} phải là số nguyên từ ${min} đến ${max}.`);
  return number;
}
export function money(value: number | null): string { return value === null ? 'Chưa có giá' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value); }
export function displayVietnam(instant: string): string { return new Intl.DateTimeFormat('vi-VN', { timeZone: vietnamTimeZone, dateStyle: 'short', timeStyle: 'short' }).format(new Date(instant)); }
