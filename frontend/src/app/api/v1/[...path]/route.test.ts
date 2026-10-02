import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET, OPTIONS, PATCH, POST } from './route';

const context = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe('API proxy route', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

  it('forwards variant status mutations and multipart media with a separate 6 MiB cap', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => Response.json({ url: 'https://media.test/image.png' }, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const status = await PATCH(new Request('http://localhost/api/v1/admin/variants/42/status', { method: 'PATCH', body: '{"isActive":false}' }), context(['admin', 'variants', '42', 'status']));
    expect(status.status).toBe(201);
    const body = new Uint8Array(5 * 1024 * 1024 + 100);
    const response = await POST(new Request('http://localhost/api/v1/admin/media', { method: 'POST', headers: { 'content-type': 'multipart/form-data; boundary=boundary', cookie: 'JSESSIONID=admin', 'x-csrf-token': 'csrf' }, body }), context(['admin', 'media']));
    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('content-type')).toBe('multipart/form-data; boundary=boundary');
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('cookie')).toBe('JSESSIONID=admin');
    expect((await POST(new Request('http://localhost/api/v1/admin/media', { method: 'POST', body: new Uint8Array(6 * 1024 * 1024 + 1) }), context(['admin', 'media']))).status).toBe(413);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('preserves separate cookies including an Expires date and disables admin caching', async () => {
    const headers = new Headers({'cache-control':'public, max-age=3600'});
    headers.append('set-cookie','JSESSIONID=one; Path=/api; HttpOnly');
    headers.append('set-cookie','other=two; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Path=/');
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}',{headers})));
    const response = await GET(new Request('http://localhost/api/v1/admin/auth/me'),context(['admin','auth','me']));
    expect(response.headers.getSetCookie()).toEqual([
      'JSESSIONID=one; Path=/api; HttpOnly',
      'other=two; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Path=/',
    ]);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('aborts slow upstream requests and returns a structured 503', async () => {
    vi.useFakeTimers(); vi.stubEnv('PROXY_TIMEOUT_MS','20');
    vi.stubGlobal('fetch',vi.fn((_url: string, init: RequestInit) => new Promise((_resolve,reject) => {
      init.signal!.addEventListener('abort',()=>reject(new DOMException('Timeout','AbortError')));
    })));
    const pending = GET(new Request('http://localhost/api/v1/products'),context(['products']));
    await vi.advanceTimersByTimeAsync(25);
    const response = await pending;
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({code:'SERVICE_UNAVAILABLE',fieldErrors:{},traceId:expect.any(String)});
  });

  it('keeps the timeout active when upstream sends headers but stalls the body', async () => {
    vi.useFakeTimers(); vi.stubEnv('PROXY_TIMEOUT_MS','20');
    vi.stubGlobal('fetch',vi.fn(async (_url:string,init:RequestInit) => new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{'));
        init.signal!.addEventListener('abort',()=>controller.error(new DOMException('Timeout','AbortError')));
      },
    }),{headers:{'content-type':'application/json'}})));
    const pending=GET(new Request('http://localhost/api/v1/products'),context(['products']));
    await vi.advanceTimersByTimeAsync(25);
    expect((await pending).status).toBe(503);
  });

  it('forwards Origin and structured authorization errors without caching', async () => {
    const error = {code:'UNAUTHENTICATED',message:'Login required',fieldErrors:{},traceId:'trace-auth'};
    const fetchMock = vi.fn().mockResolvedValue(Response.json(error,{status:401}));
    vi.stubGlobal('fetch',fetchMock);
    const response = await POST(new Request('http://localhost/api/v1/admin/auth/login',{
      method:'POST',headers:{origin:'http://localhost','content-type':'application/json'},body:'{}',
    }),context(['admin','auth','login']));
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('origin')).toBe('http://localhost');
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual(error);
  });

  it('rejects bodies above the configured limit before contacting upstream', async () => {
    vi.stubEnv('PROXY_MAX_BODY_BYTES','8');
    const fetchMock = vi.fn().mockResolvedValue(Response.json({})); vi.stubGlobal('fetch',fetchMock);
    const response = await POST(new Request('http://localhost/api/v1/orders',{method:'POST',body:'123456789'}),context(['orders']));
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects disallowed methods and traversal without contacting upstream', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch',fetchMock);
    const response = await POST(new Request('http://localhost/api/v1/categories',{method:'POST',body:'{}'}),context(['categories']));
    expect(response.status).toBe(404);
    expect((await GET(new Request('http://localhost/api/v1/products'),context(['products','..']))).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards public GETs to the server-only backend origin', async () => {
    vi.stubEnv('BACKEND_API_ORIGIN', 'http://backend.internal');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ content: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(new Request('http://localhost/api/v1/products?page=1'), context(['products']));
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://backend.internal/api/v1/products?page=1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('forwards POST bodies, cookies and idempotency headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ orderCode: 'HMN-1' }), {
        status: 201,
        headers: { 'content-type': 'application/json', 'set-cookie': 'JSESSIONID=session-1; Path=/' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const request = new Request('http://localhost/api/v1/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'JSESSIONID=session-0',
        'idempotency-key': 'key-1',
        'x-csrf-token': 'csrf-1',
      },
      body: JSON.stringify({ items: [] }),
    });

    const response = await POST(request, context(['orders']));
    expect(response.status).toBe(201);
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      method: 'POST',
      body: expect.any(ArrayBuffer),
    }));
    const forwardedHeaders = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(forwardedHeaders.get('cookie')).toBe('JSESSIONID=session-0');
    expect(forwardedHeaders.get('idempotency-key')).toBe('key-1');
    expect(forwardedHeaders.get('x-csrf-token')).toBe('csrf-1');
    expect(response.headers.get('set-cookie')).toContain('JSESSIONID=session-1');
  });

  it('rejects paths outside the allowlist', async () => {
    const response = await GET(new Request('http://localhost/api/v1/not-allowed'), context(['not-allowed']));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('answers preflight without contacting the backend', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await OPTIONS(new Request('http://localhost/api/v1/orders', { method: 'OPTIONS' }), context(['orders']));
    expect(response.status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
