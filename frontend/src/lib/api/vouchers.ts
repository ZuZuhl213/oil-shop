import { apiFetch, mutationHeaders } from './client';
import type { PricePreview, VoucherValidateRequest } from './contracts/types';

export async function validateVoucher(body: VoucherValidateRequest): Promise<PricePreview> {
  return apiFetch<PricePreview>('/vouchers/validate', {
    method: 'POST',
    headers: await mutationHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
}
