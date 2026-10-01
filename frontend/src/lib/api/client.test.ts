import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiClientError,
  apiFetch,
  getCsrf,
} from './client';
import { createOrder } from './orders';

describe('apiFetch', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the same-origin API prefix and sends JSON with credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch<{ ok: boolean }>('/products')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/products',
      expect.objectContaining({ credentials: 'include', cache: 'no-store' }),
    );
    const requestHeaders = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(requestHeaders.get('Accept')).toBe('application/json');
  });

  it('serializes object bodies and preserves mutation headers', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'csrf-token', headerName: 'X-CSRF-TOKEN' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ orderCode: 'HMN-1' }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const body = {
      orderType: 'ORDER' as const,
      customerName: 'Nguyen Van A',
      phone: '0912345678',
      items: [{ variantId: '1', quantity: 1 }],
    };

    await createOrder(body, '00000000-0000-4000-8000-000000000001');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/orders');
    const orderHeaders = new Headers(fetchMock.mock.calls[1][1].headers);
    expect(orderHeaders.get('Accept')).toBe('application/json');
    expect(orderHeaders.get('Content-Type')).toBe('application/json');
    expect(orderHeaders.get('Idempotency-Key')).toBe('00000000-0000-4000-8000-000000000001');
    expect(orderHeaders.get('X-CSRF-TOKEN')).toBe('csrf-token');
    expect(fetchMock.mock.calls[1][1].body).toBe(JSON.stringify(body));
  });

  it('maps structured API errors and network failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            fieldErrors: { 'items[1].quantity': 'Invalid quantity' },
            traceId: 'trace-1',
          }),
          { status: 422, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    await expect(apiFetch('/orders', { method: 'POST' })).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      fieldErrors: { 'items[1].quantity': 'Invalid quantity' },
      traceId: 'trace-1',
    });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(apiFetch('/categories')).rejects.toMatchObject({
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
    });
  });

  it('rejects absolute URLs and reads CSRF responses', async () => {
    await expect(apiFetch('https://example.test/api')).rejects.toThrow(
      'same-origin paths',
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ token: 'csrf-token', headerName: 'X-CSRF-TOKEN' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    await expect(getCsrf()).resolves.toEqual({ token: 'csrf-token', headerName: 'X-CSRF-TOKEN' });
  });

  it('returns undefined for a no-content response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(apiFetch('/csrf')).resolves.toBeUndefined();
  });

  it('keeps a structured 401 response for the auth caller', async () => {
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({
      code:'UNAUTHENTICATED',message:'Login required',fieldErrors:{},traceId:'auth-trace',
    },{status:401})));
    await expect(apiFetch('/admin/auth/me')).rejects.toMatchObject({status:401,code:'UNAUTHENTICATED',traceId:'auth-trace'});
  });

  it('exposes the original status on ApiClientError', () => {
    const error = new ApiClientError(409, {
      code: 'IDEMPOTENCY_CONFLICT',
      message: 'Key already used',
      fieldErrors: {},
      traceId: 'trace-2',
    });
    expect(error).toMatchObject({ status: 409, code: 'IDEMPOTENCY_CONFLICT', traceId: 'trace-2' });
  });
});
