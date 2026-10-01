'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckoutForm } from '@/features/checkout/CheckoutForm';

function CheckoutRoute() {
  const searchParams = useSearchParams();
  return <CheckoutForm legacyQuoteMode={searchParams.get('mode') === 'quote'} />;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="site-container py-20 text-center text-text-muted" role="status">Đang tải phiếu đặt hàng…</div>}>
      <CheckoutRoute />
    </Suspense>
  );
}
