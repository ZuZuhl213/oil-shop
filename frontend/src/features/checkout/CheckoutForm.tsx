'use client';

/* eslint-disable react-hooks/set-state-in-effect -- hydrate the pending attempt and invalidate voucher previews on cart changes */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';
import { useCart, type CartItem } from '@/context/CartContext';
import type { CreateOrderRequest, ItemInput, OrderReceipt, PricePreview } from '@/lib/api/contracts/types';
import { ApiClientError } from '@/lib/api/client';
import { formatCurrencyVnd } from '@/lib/format/currency';
import {
  clearQuoteDraft,
  readQuoteDraft,
  rememberReceipt,
  type PendingOrderAttempt,
  type QuoteDraft,
} from '@/lib/checkout-storage';
import { createOrder, validateVoucher } from './checkout-api';
import { clearCheckoutAttempt, createCheckoutAttempt, readCheckoutAttempt, saveCheckoutAttempt } from './checkout-attempt';

type ContactField = 'customerName' | 'phone' | 'address' | 'note' | 'voucherCode';
type CheckoutLine = CartItem;
type CheckoutFieldErrors = Partial<Record<ContactField, string>> & Record<string, string | undefined>;

interface CheckoutFormProps {
  legacyQuoteMode?: boolean;
}

interface VoucherPreviewState {
  signature: string;
  value: PricePreview;
}

interface VoucherFeedback {
  signature: string;
  type: 'success' | 'error';
  text: string;
}

function toQuoteCartItem(draft: QuoteDraft): CheckoutLine {
  return { ...draft, price: null, saleType: 'QUOTE' };
}

function pendingLineItems(attempt: PendingOrderAttempt, available: CheckoutLine[], isQuote: boolean): CheckoutLine[] {
  return attempt.payload.items.map((line) => {
    const local = available.find((item) => item.variantId === line.variantId);
    return local ? { ...local, quantity: line.quantity } : {
      productId: '',
      productName: 'Sản phẩm trong yêu cầu đã gửi',
      productSlug: '',
      variantId: line.variantId,
      variantName: '#' + line.variantId,
      quantity: line.quantity,
      minQuantity: line.quantity,
      quantityStep: 1,
      price: null,
      saleType: isQuote ? 'QUOTE' : 'FIXED_PRICE',
      thumbnailType: 'peanut',
    };
  });
}

function itemSignature(items: ItemInput[]): string {
  return [...items]
    .sort((a, b) => a.variantId.localeCompare(b.variantId))
    .map((item) => `${item.variantId}:${item.quantity.toFixed(2)}`)
    .join('|');
}

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) return error.message || fallback;
  return fallback;
}

function validateField(field: ContactField, value: string): string | undefined {
  const trimmed = value.trim();
  if (field === 'customerName') {
    if (!trimmed) return 'Vui lòng nhập họ và tên.';
    if (trimmed.length > 100) return 'Họ tên không được dài quá 100 ký tự.';
  }
  if (field === 'phone') {
    if (!trimmed) return 'Vui lòng nhập số điện thoại.';
    if (!/^(?:0[0-9]{9}|\+84[0-9]{9})$/.test(trimmed)) return 'Nhập 10 chữ số bắt đầu bằng 0 hoặc +84 và 9 chữ số.';
  }
  if (field === 'address' && trimmed.length > 1000) return 'Địa chỉ không được dài quá 1000 ký tự.';
  if (field === 'note' && trimmed.length > 2000) return 'Ghi chú không được dài quá 2000 ký tự.';
  return undefined;
}

function formatQuantity(quantity: number): string {
  return quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

export function CheckoutForm({ legacyQuoteMode = false }: CheckoutFormProps) {
  const router = useRouter();
  const {
    items,
    saleType,
    subtotal,
    clearCartIfMatches,
    isHydrated: cartHydrated,
  } = useCart();
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft | null>(null);
  const [pendingAttempt, setPendingAttempt] = useState<PendingOrderAttempt | null>(null);
  const [checkoutHydrated, setCheckoutHydrated] = useState(false);
  const [step, setStep] = useState<'form' | 'review'>('form');
  const submittingRef = useRef(false);
  const submissionSucceededRef = useRef(false);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [itemUnavailableError, setItemUnavailableError] = useState(false);
  const [attemptStorageWarning, setAttemptStorageWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSucceeded, setSubmissionSucceeded] = useState(false);
  const [isVoucherLoading, setIsVoucherLoading] = useState(false);
  const [voucherPreview, setVoucherPreview] = useState<VoucherPreviewState | null>(null);
  const [voucherFeedback, setVoucherFeedback] = useState<VoucherFeedback | null>(null);
  const [successfulReceipt, setSuccessfulReceipt] = useState<OrderReceipt | null>(null);
  const voucherRequestSequence = useRef(0);

  const cartIsQuote = saleType === 'QUOTE';
  const availableItems: CheckoutLine[] = legacyQuoteMode
    ? quoteDraft ? [toQuoteCartItem(quoteDraft)] : cartIsQuote ? items : []
    : items;
  const isQuoteOrder = pendingAttempt
    ? pendingAttempt.payload.orderType === 'QUOTE_REQUEST'
    : legacyQuoteMode && quoteDraft ? true : cartIsQuote;
  const checkoutItems: CheckoutLine[] = pendingAttempt
    ? pendingLineItems(pendingAttempt, availableItems, isQuoteOrder)
    : availableItems;
  const orderItems: ItemInput[] = checkoutItems.map(({ variantId, quantity }) => ({ variantId, quantity }));
  const cartSignature = itemSignature(orderItems);
  const voucherSignature = `${isQuoteOrder ? 'QUOTE_REQUEST' : 'ORDER'}|${cartSignature}|${voucherCode.trim().toUpperCase()}`;
  const voucherSignatureRef = useRef(voucherSignature);
  useLayoutEffect(() => {
    voucherSignatureRef.current = voucherSignature;
  }, [voucherSignature]);
  const activeVoucherPreview = voucherPreview?.signature === voucherSignature ? voucherPreview.value : null;
  const activeVoucherFeedback = voucherFeedback?.signature === voucherSignature ? voucherFeedback : null;
  const estimatedSubtotal = pendingAttempt
    ? checkoutItems.every((item) => item.price != null)
      ? checkoutItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0)
      : null
    : subtotal;
  const displaySubtotal = isQuoteOrder ? null : activeVoucherPreview?.subtotal ?? estimatedSubtotal;
  const displayTotal = isQuoteOrder ? null : activeVoucherPreview?.totalAmount ?? estimatedSubtotal;
  const displayDiscount = isQuoteOrder ? 0 : activeVoucherPreview?.discountAmount ?? 0;
  const errorEntries = Object.entries(fieldErrors).filter((entry): entry is [string, string] => Boolean(entry[1]));
  const hasCartItemError = itemUnavailableError || errorEntries.some(([field]) => field === 'variantId' || field.startsWith('items'));

  useEffect(() => {
    const attempt = readCheckoutAttempt();
    const draft = legacyQuoteMode ? readQuoteDraft() : null;
    setPendingAttempt(attempt);
    setQuoteDraft(draft);
    if (attempt) {
      setCustomerName(attempt.payload.customerName);
      setPhone(attempt.payload.phone);
      setAddress(attempt.payload.address ?? '');
      setNote(attempt.payload.note ?? '');
      setVoucherCode(attempt.payload.voucherCode ?? '');
      setStep('review');
    }
    setCheckoutHydrated(true);
  }, [legacyQuoteMode]);

  useEffect(() => {
    voucherRequestSequence.current += 1;
    setIsVoucherLoading(false);
    setVoucherPreview(null);
    setVoucherFeedback(null);
  }, [cartSignature]);

  useEffect(() => {
    if (step === 'review') reviewHeadingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (errorEntries.length || submitError) errorSummaryRef.current?.focus();
  }, [errorEntries.length, submitError]);

  const setFieldValue = (field: ContactField, value: string) => {
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    if (field === 'customerName') setCustomerName(value);
    if (field === 'phone') setPhone(value);
    if (field === 'address') setAddress(value);
    if (field === 'note') setNote(value);
    if (field === 'voucherCode') {
      voucherRequestSequence.current += 1;
      setIsVoucherLoading(false);
      setVoucherPreview(null);
      setVoucherFeedback(null);
      setVoucherCode(value);
    }
  };

  const validateContact = () => {
    const nextErrors: Partial<Record<ContactField, string>> = {};
    const nameError = validateField('customerName', customerName);
    const phoneError = validateField('phone', phone);
    const addressError = validateField('address', address);
    const noteError = validateField('note', note);
    if (nameError) nextErrors.customerName = nameError;
    if (phoneError) nextErrors.phone = phoneError;
    if (addressError) nextErrors.address = addressError;
    if (noteError) nextErrors.note = noteError;
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleBlur = (field: ContactField, value: string) => {
    setFieldErrors((previous) => ({ ...previous, [field]: validateField(field, value) }));
  };

  const handleContinue = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (checkoutItems.length === 0) {
      setSubmitError('Giỏ hàng đang trống. Hãy quay lại chọn sản phẩm trước khi tiếp tục.');
      return;
    }
    if (!validateContact()) {
      setSubmitError('Vui lòng sửa thông tin được đánh dấu trước khi tiếp tục.');
      return;
    }
    setSubmitError(null);
    setStep('review');
  };

  const handleVoucherChange = (value: string) => setFieldValue('voucherCode', value);

  const handleApplyVoucher = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = voucherCode.trim().toUpperCase();
    if (!code || isQuoteOrder || pendingAttempt || isVoucherLoading) return;
    const signature = voucherSignature;
    const requestSequence = ++voucherRequestSequence.current;
    setVoucherFeedback(null);
    setVoucherPreview(null);
    setIsVoucherLoading(true);
    try {
      const preview = await validateVoucher(code, orderItems);
      if (voucherRequestSequence.current !== requestSequence || voucherSignatureRef.current !== signature) return;
      setVoucherPreview({ signature, value: preview });
      setVoucherFeedback({
        signature,
        type: 'success',
        text: `Đã kiểm tra mã ${preview.voucherCode ?? code}. Số tiền cuối cùng được backend xác nhận khi gửi đơn.`,
      });
    } catch (error) {
      if (voucherRequestSequence.current !== requestSequence || voucherSignatureRef.current !== signature) return;
      setVoucherPreview(null);
      setVoucherFeedback({
        signature,
        type: 'error',
        text: messageFor(error, 'Mã giảm giá không hợp lệ hoặc đã hết lượt dùng. Hãy kiểm tra mã rồi thử lại.'),
      });
    } finally {
      if (voucherRequestSequence.current === requestSequence) setIsVoucherLoading(false);
    }
  };

  const handleSubmitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!checkoutHydrated || !cartHydrated || submittingRef.current || submissionSucceededRef.current) return;
    if (!pendingAttempt && (!validateContact() || checkoutItems.length === 0)) {
      setSubmitError(checkoutItems.length === 0
        ? 'Giỏ hàng đang trống. Hãy quay lại chọn sản phẩm trước khi gửi.'
        : 'Vui lòng sửa thông tin được đánh dấu trước khi gửi.');
      setStep('form');
      return;
    }

    const payload: CreateOrderRequest = pendingAttempt?.payload ?? {
      orderType: isQuoteOrder ? 'QUOTE_REQUEST' : 'ORDER',
      customerName: customerName.trim(),
      phone: phone.trim(),
      ...(address.trim() ? { address: address.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(!isQuoteOrder && voucherCode.trim() ? { voucherCode: voucherCode.trim().toUpperCase() } : {}),
      items: orderItems,
    };
    let attempt: PendingOrderAttempt;
    try {
      attempt = pendingAttempt ?? createCheckoutAttempt(payload);
    } catch (error) {
      setSubmitError(messageFor(error, 'Trình duyệt chưa thể tạo mã gửi đơn an toàn. Hãy tải lại trang rồi thử lại.'));
      return;
    }

    submittingRef.current = true;
    setPendingAttempt(attempt);
    setSubmitError(null);
    setItemUnavailableError(false);
    setIsSubmitting(true);
    setAttemptStorageWarning(!saveCheckoutAttempt(attempt));

    try {
      const receipt: OrderReceipt = await createOrder(payload, attempt.key);
      setSuccessfulReceipt(receipt);
      const receiptRecord = {
        ...receipt,
        items: checkoutItems,
      };
      rememberReceipt(receipt.orderCode, receiptRecord);
      try {
        window.sessionStorage.setItem('hm_order_receipt_' + receipt.orderCode, JSON.stringify(receiptRecord));
      } catch {
        // The receipt remains available in memory for this tab.
      }
      clearCheckoutAttempt();
      if (payload.orderType === 'QUOTE_REQUEST') clearQuoteDraft();
      submissionSucceededRef.current = true;
      setSubmissionSucceeded(true);
      setPendingAttempt(null);
      if (payload.orderType === 'ORDER') clearCartIfMatches(payload.items);
      router.push('/orders/' + receipt.orderCode);
    } catch (error) {
      const status = error instanceof ApiClientError ? error.status : 0;
      const definitiveRejection = status >= 400 && status < 500 && status !== 408;
      if (definitiveRejection) {
        clearCheckoutAttempt();
        setPendingAttempt(null);
        setAttemptStorageWarning(false);
        setFieldErrors(error instanceof ApiClientError ? error.fieldErrors as CheckoutFieldErrors : {});
        setItemUnavailableError(error instanceof ApiClientError && error.code === 'ITEM_UNAVAILABLE');
        if (error instanceof ApiClientError && ['VOUCHER_INVALID', 'VOUCHER_EXHAUSTED', 'ITEM_UNAVAILABLE'].includes(error.code)) {
          voucherRequestSequence.current += 1;
          setVoucherPreview(null);
          setVoucherFeedback(null);
          setIsVoucherLoading(false);
        }
        const rejectionMessage = error instanceof ApiClientError && error.code === 'IDEMPOTENCY_CONFLICT'
          ? 'Mã gửi này đã được dùng cho nội dung khác. Hãy kiểm tra đơn hàng gần nhất hoặc quay lại giỏ để bắt đầu lần gửi mới.'
          : error instanceof ApiClientError && error.code === 'ITEM_UNAVAILABLE'
            ? `${messageFor(error, 'Một sản phẩm không còn khả dụng.')} Hãy quay lại giỏ hàng để kiểm tra trước khi gửi lại.`
            : messageFor(error, 'Yêu cầu đã bị từ chối. Vui lòng kiểm tra lại thông tin trước khi gửi.');
        setSubmitError(rejectionMessage);
        setStep('form');
      } else {
        setSubmitError('Chưa xác định được kết quả gửi đơn. Lần gửi này được giữ nguyên; hãy thử lại để kiểm tra mà không tạo đơn trùng.');
        setStep('review');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (!checkoutHydrated || !cartHydrated) {
    return <div className="site-container py-20 text-center text-text-muted" role="status">Đang tải phiếu đặt hàng…</div>;
  }

  if (successfulReceipt) {
    return (
      <section className="site-container mx-auto max-w-2xl py-16 text-center sm:py-24" aria-labelledby="checkout-success-title">
        <p className="section-eyebrow">HM NATURALS</p>
        <h1 id="checkout-success-title" className="section-title mt-2">Đã tiếp nhận yêu cầu</h1>
        <p className="mt-3 text-base leading-7 text-text-muted">
          {successfulReceipt.orderType === 'QUOTE_REQUEST'
            ? 'Đã gửi yêu cầu báo giá. Shop sẽ liên hệ để xác nhận quy cách và mức giá.'
            : 'Đã gửi yêu cầu đặt hàng. Shop sẽ liên hệ để xác nhận thông tin và phí giao nhận.'}
        </p>
        <div className="mt-6 rounded-2xl border border-soft-sand bg-white-pure p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Mã yêu cầu</p>
          <p className="mt-1 break-all text-xl font-semibold text-forest-green">{successfulReceipt.orderCode}</p>
          {successfulReceipt.orderType === 'QUOTE_REQUEST' ? (
            <p className="mt-4 text-sm text-text-muted">Báo giá được xác nhận sau khi shop liên hệ.</p>
          ) : successfulReceipt.totalAmount != null ? (
            <p className="mt-4 text-sm text-text-muted">
              Tổng tiền backend xác nhận: <strong className="tabular-nums text-dark-cocoa">{formatCurrencyVnd(successfulReceipt.totalAmount)}</strong>
            </p>
          ) : null}
        </div>
        <p className="mt-4 text-sm text-text-muted">Đây chưa phải xác nhận thanh toán. Shop sẽ chủ động liên hệ với bạn.</p>
        <Link href={`/orders/${encodeURIComponent(successfulReceipt.orderCode)}`} className="btn-action-touch fixed-flow mt-6">Xem biên nhận</Link>
      </section>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <section className="site-container mx-auto max-w-2xl py-16 text-center sm:py-24">
        <p className="section-eyebrow">HM NATURALS</p>
        <h1 className="section-title mt-2">{legacyQuoteMode ? 'Chưa có sản phẩm báo giá' : 'Giỏ hàng đang trống'}</h1>
        <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-text-muted">
          {legacyQuoteMode ? 'Hãy quay lại sản phẩm báo giá và chọn quy cách cần tư vấn.' : 'Chọn sản phẩm trước khi gửi yêu cầu đặt hàng hoặc báo giá.'}
        </p>
        <Link href="/products" className="btn-action-touch fixed-flow mt-6">Xem sản phẩm</Link>
      </section>
    );
  }

  return (
    <section className="site-container py-6 pb-16 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="section-eyebrow">{isQuoteOrder ? 'Yêu cầu báo giá' : 'Đặt hàng'}</p>
          <h1 className="section-title mt-1">{isQuoteOrder ? 'Gửi yêu cầu báo giá' : 'Gửi yêu cầu đặt hàng'}</h1>
          <p className="mt-2 text-sm leading-6 text-text-muted">Shop sẽ liên hệ để xác nhận thông tin và phí giao nhận. Chưa có thanh toán trực tuyến.</p>
        </div>

        <div className="space-y-3">
          {checkoutItems.map((item) => (
            <article key={item.variantId} className="form-order-summary">
              <div className="order-item-thumb overflow-hidden bg-warm-cream flex items-center justify-center">
                <ProductBottleImage type={item.thumbnailType ?? 'peanut'} alt={item.productName} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-forest-green">{item.productName}</h2>
                <p className="mt-1 text-sm text-text-muted">Quy cách: {item.variantName} · Số lượng: {formatQuantity(item.quantity)}</p>
                <p className="mt-1 text-sm font-semibold text-dark-cocoa">
                  {item.price == null ? 'Shop sẽ báo giá sau khi xác nhận' : formatCurrencyVnd(item.price * item.quantity)}
                </p>
              </div>
            </article>
          ))}
        </div>

        {isQuoteOrder ? (
          <p className="my-5 rounded-xl border border-soft-sand bg-white-pure p-4 text-sm leading-6 text-text-muted">
            Yêu cầu báo giá không có tổng tiền cố định. Shop sẽ liên hệ để xác nhận số lượng và mức giá.
          </p>
        ) : (
          <section className="my-5 rounded-xl border border-soft-sand bg-white-pure p-4 text-sm leading-6" aria-label="Tóm tắt tiền hàng">
            <div className="flex justify-between gap-4 text-text-muted">
              <span>Tạm tính ước lượng:</span>
              <span className="tabular-nums">{formatCurrencyVnd(displaySubtotal)}</span>
            </div>
            {displayDiscount > 0 && <div className="mt-1 flex justify-between gap-4 font-medium text-peanut-bark">
              <span>Chiết khấu voucher:</span><span>- {formatCurrencyVnd(displayDiscount)}</span>
            </div>}
            <div className="mt-1 flex justify-between gap-4 text-text-muted">
              <span>Phí giao nhận:</span><span>Shop xác nhận qua điện thoại</span>
            </div>
            <div className="mt-2 flex justify-between gap-4 border-t border-soft-sand-light pt-2 font-semibold text-forest-green">
              <span>Tổng ước lượng:</span><span className="tabular-nums">{formatCurrencyVnd(displayTotal)}</span>
            </div>
            <p className="mt-2 text-xs text-text-muted">Số tiền cuối cùng do backend tính lại khi gửi yêu cầu.</p>
          </section>
        )}

        {!isQuoteOrder && !pendingAttempt && <form onSubmit={handleApplyVoucher} className="mb-5 flex flex-col gap-2 sm:flex-row">
          <div className="min-w-0 flex-1">
            <label htmlFor="voucherCode" className="form-field-label">Mã giảm giá (không bắt buộc)</label>
            <input
              id="voucherCode"
              type="text"
              className="form-field-input checkout-input"
              value={voucherCode}
              onChange={(event) => handleVoucherChange(event.currentTarget.value)}
              maxLength={50}
              autoComplete="off"
              aria-describedby={fieldErrors.voucherCode ? 'voucherCode-error' : undefined}
              aria-invalid={Boolean(fieldErrors.voucherCode)}
            />
            {fieldErrors.voucherCode && <p className="mt-1 text-sm text-error-crimson" id="voucherCode-error">{fieldErrors.voucherCode}</p>}
          </div>
          <button type="submit" className="btn-action-touch quote-flow self-end" disabled={isVoucherLoading || !voucherCode.trim()}>
            {isVoucherLoading ? 'Đang kiểm tra…' : 'Kiểm tra voucher'}
          </button>
        </form>}
        {activeVoucherFeedback && <p className={`mb-4 rounded-xl border bg-white-pure p-3 text-sm ${activeVoucherFeedback.type === 'error' ? 'border-error-crimson text-error-crimson' : 'border-soft-sand text-forest-green'}`} role={activeVoucherFeedback.type === 'error' ? 'alert' : 'status'}>{activeVoucherFeedback.text}</p>}

        {(submitError || errorEntries.length > 0) && <div
          ref={errorSummaryRef}
          className="mb-4 rounded-xl border border-error-crimson bg-white-pure p-4 text-sm text-error-crimson"
          role="alert"
          tabIndex={-1}
          aria-labelledby="checkout-error-title"
        >
          <h2 id="checkout-error-title" className="font-semibold">Có thông tin cần kiểm tra</h2>
          {submitError && <p className="mt-1">{submitError}</p>}
          {errorEntries.length > 0 && <ul className="mt-2 list-inside list-disc">
            {errorEntries.map(([field, message]) => {
              if (field === 'variantId') return <li key={field}>Một sản phẩm trong giỏ không còn bán.</li>;
              return <li key={field}><a className="underline" href={`#${field}`}>{message}</a></li>;
            })}
          </ul>}
          {hasCartItemError && <p className="mt-2"><Link className="underline" href="/cart">Quay lại giỏ hàng để kiểm tra sản phẩm</Link></p>}
        </div>}

        {attemptStorageWarning && <p className="mb-4 rounded-xl border border-soft-sand bg-white-pure p-3 text-sm text-text-muted" role="status">
          Trình duyệt không lưu được bản dự phòng của lần gửi. Lần thử lại vẫn được giữ trong bộ nhớ của trang đang mở.
        </p>}

        {step === 'review' ? (
          <section className="form-screen-wrap rounded-2xl border border-soft-sand bg-white-pure" aria-labelledby="checkout-review-title">
            <h2 id="checkout-review-title" ref={reviewHeadingRef} tabIndex={-1} className="text-xl font-semibold text-forest-green">Kiểm tra lại yêu cầu</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="font-semibold text-text-muted">Họ và tên</dt><dd className="mt-1">{customerName}</dd></div>
              <div><dt className="font-semibold text-text-muted">Số điện thoại</dt><dd className="mt-1">{phone}</dd></div>
              <div><dt className="font-semibold text-text-muted">Địa chỉ (không bắt buộc)</dt><dd className="mt-1">{address.trim() || 'Có thể xác nhận sau qua điện thoại'}</dd></div>
              {note.trim() && <div><dt className="font-semibold text-text-muted">Ghi chú</dt><dd className="mt-1 whitespace-pre-wrap">{note}</dd></div>}
              {voucherCode.trim() && !isQuoteOrder && <div><dt className="font-semibold text-text-muted">Voucher</dt><dd className="mt-1">{voucherCode.trim().toUpperCase()}</dd></div>}
              <div><dt className="font-semibold text-text-muted">Loại yêu cầu</dt><dd className="mt-1">{isQuoteOrder ? 'Yêu cầu báo giá' : 'Yêu cầu đặt hàng'}</dd></div>
              {!isQuoteOrder && <div><dt className="font-semibold text-text-muted">Tổng ước lượng</dt><dd className="mt-1 font-semibold tabular-nums">{formatCurrencyVnd(displayTotal)}</dd></div>}
            </dl>
            {pendingAttempt && <p className="mt-4 rounded-lg bg-warm-cream p-3 text-sm text-text-muted" role="status">
              Kết quả lần gửi trước chưa xác định. Thử lại với cùng dữ liệu để tránh tạo đơn trùng.
            </p>}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              {!pendingAttempt && <button type="button" className="btn-action-touch quote-flow" onClick={() => { setSubmitError(null); setStep('form'); }}>Quay lại chỉnh sửa</button>}
              <form onSubmit={handleSubmitOrder} className="sm:ml-auto">
                <button type="submit" className="btn-action-touch fixed-flow w-full sm:min-w-64" disabled={isSubmitting || submissionSucceeded}>
                  {isSubmitting ? 'Đang gửi yêu cầu…' : pendingAttempt ? 'Thử lại với cùng mã gửi' : isQuoteOrder ? 'Xác nhận và gửi yêu cầu báo giá' : 'Xác nhận và gửi yêu cầu'}
                </button>
              </form>
            </div>
          </section>
        ) : (
          <form onSubmit={handleContinue} className="form-screen-wrap space-y-1 rounded-2xl border border-soft-sand bg-white-pure">
            <h2 className="mb-4 text-xl font-semibold text-forest-green">Thông tin liên hệ</h2>
            <fieldset disabled={Boolean(pendingAttempt)} className="min-w-0 border-0 p-0">
              <div className="form-row-group">
                <label className="form-field-label" htmlFor="customerName">Họ và tên <span aria-hidden="true">*</span></label>
                <input
                  id="customerName" type="text" className="form-field-input checkout-input"
                  placeholder="Ví dụ: Nguyễn Văn An" value={customerName} required maxLength={100} autoComplete="name"
                  onChange={(event) => setFieldValue('customerName', event.currentTarget.value)}
                  onBlur={(event) => handleBlur('customerName', event.currentTarget.value)}
                  aria-invalid={Boolean(fieldErrors.customerName)} aria-describedby={fieldErrors.customerName ? 'customerName-error' : undefined}
                />
                {fieldErrors.customerName && <p className="mt-1 text-sm text-error-crimson" id="customerName-error">{fieldErrors.customerName}</p>}
              </div>
              <div className="form-row-group">
                <label className="form-field-label" htmlFor="phone">Số điện thoại <span aria-hidden="true">*</span></label>
                <input
                  id="phone" type="tel" inputMode="tel" className="form-field-input checkout-input"
                  placeholder="0912345678 hoặc +84912345678" value={phone} required maxLength={13} autoComplete="tel"
                  pattern="(0[0-9]{9}|\+84[0-9]{9})"
                  onChange={(event) => setFieldValue('phone', event.currentTarget.value)}
                  onBlur={(event) => handleBlur('phone', event.currentTarget.value)}
                  aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                />
                {fieldErrors.phone && <p className="mt-1 text-sm text-error-crimson" id="phone-error">{fieldErrors.phone}</p>}
              </div>
              <div className="form-row-group">
                <label className="form-field-label" htmlFor="address">Địa chỉ nhận hàng (không bắt buộc)</label>
                <input
                  id="address" type="text" className="form-field-input checkout-input"
                  placeholder="Có thể bổ sung khi shop gọi xác nhận" value={address} maxLength={1000} autoComplete="street-address"
                  onChange={(event) => setFieldValue('address', event.currentTarget.value)}
                  onBlur={(event) => handleBlur('address', event.currentTarget.value)}
                  aria-invalid={Boolean(fieldErrors.address)} aria-describedby={fieldErrors.address ? 'address-error' : undefined}
                />
                {fieldErrors.address && <p className="mt-1 text-sm text-error-crimson" id="address-error">{fieldErrors.address}</p>}
              </div>
              <div className="form-row-group">
                <label className="form-field-label" htmlFor="note">Ghi chú (không bắt buộc)</label>
                <textarea
                  id="note" className="form-field-textarea checkout-input" placeholder="Thông tin giúp shop xác nhận yêu cầu"
                  value={note} maxLength={2000} autoComplete="off"
                  onChange={(event) => setFieldValue('note', event.currentTarget.value)}
                  onBlur={(event) => handleBlur('note', event.currentTarget.value)}
                  aria-invalid={Boolean(fieldErrors.note)} aria-describedby={fieldErrors.note ? 'note-error' : undefined}
                />
                {fieldErrors.note && <p className="mt-1 text-sm text-error-crimson" id="note-error">{fieldErrors.note}</p>}
              </div>
            </fieldset>
            <button type="submit" className="btn-action-touch fixed-flow mt-3 w-full">
              Xem lại thông tin
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
