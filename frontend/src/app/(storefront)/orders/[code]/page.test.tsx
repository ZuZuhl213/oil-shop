import React, { Suspense } from 'react';
import { act, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { rememberReceipt } from '@/lib/checkout-storage';
import ReceiptPage from './page';

it('shows the successful response when session storage is unavailable', async () => {
  const orderCode='DH-MEMORY-RECEIPT';
  rememberReceipt(orderCode, {
    orderCode,orderType:'ORDER',status:'NEW',subtotal:90000,discountAmount:0,totalAmount:90000,createdAt:'2026-09-26T00:00:00Z',
    customer:{fullName:'Nguyen Van A',phone:'0912345678',address:'',channel:'Phone',note:''},
    items:[{productName:'Dầu từ API',variantId:'15',variantName:'1L',price:90000,quantity:1,thumbnailType:'peanut'}],
  });
  vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('blocked');});
  const params=Promise.resolve({code:orderCode});
  await act(async ()=>{render(<Suspense fallback="Loading"><ReceiptPage params={params}/></Suspense>);});
  expect(await screen.findByRole('heading',{name:'Biên Nhận Đặt Hàng'})).toBeVisible();
  expect(screen.getByText('Dầu từ API')).toBeVisible();
  expect(screen.queryByText(/tạo yêu cầu mới/)).not.toBeInTheDocument();
});
