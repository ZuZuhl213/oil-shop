import { afterEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET, OPTIONS, PATCH, POST } from './route';

const context = (path: string[]) => ({ params: Promise.resolve({ path }) });

function chunkedRequest(chunks: Uint8Array[], headers?: HeadersInit, path = 'orders') {
  let delivered = 0;
  const cancel = vi.fn();
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (delivered === chunks.length) controller.close();
      else controller.enqueue(chunks[delivered++]);
    },
    cancel,
  }, { highWaterMark: 0 });
  const init: RequestInit & { duplex: 'half' } = { method: 'POST', headers, body: stream, duplex: 'half' };
  const request = new Request(`http://localhost/api/v1/${path}`, init);
  return { request, cancel, delivered: () => delivered };
}

describe('API proxy route', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

  it.each([8, 6])('forwards all chunk bytes when body fits the %i-byte limit including equality', async (limit) => {
    vi.stubEnv('PROXY_MAX_BODY_BYTES', String(limit));
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal('fetch', fetchMock);
    const source = chunkedRequest([new Uint8Array([0, 255]), new Uint8Array([1, 2, 3, 4])]);
    expect((await POST(source.request, context(['orders']))).status).toBe(200);
    expect([...new Uint8Array(fetchMock.mock.calls[0][1].body)]).toEqual([0, 255, 1, 2, 3, 4]);
    expect(source.cancel).not.toHaveBeenCalled();
    expect(source.request.body!.locked).toBe(false);
  });

  it('rejects an oversized Content-Length without reading and cancels the unused stream', async () => {
    vi.stubEnv('PROXY_MAX_BODY_BYTES', '8');
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const source = chunkedRequest([new Uint8Array(9)], { 'content-length': '9' });
    expect((await POST(source.request, context(['orders']))).status).toBe(413);
    expect(source.delivered()).toBe(0);
    expect(source.cancel).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(source.request.body!.locked).toBe(false);
  });

  it.each([undefined, '1'])('stops reading an oversized stream with Content-Length %s', async (length) => {
    vi.stubEnv('PROXY_MAX_BODY_BYTES', '8');
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const source = chunkedRequest([new Uint8Array(4), new Uint8Array(5), new Uint8Array(100)], length ? { 'content-length': length } : undefined);
    const response = await POST(source.request, context(['orders']));
    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({ code: 'REQUEST_TOO_LARGE', fieldErrors: {}, traceId: expect.any(String) });
    expect(source.delivered()).toBe(2);
    expect(source.cancel).toHaveBeenCalledTimes(1);
    expect(source.request.body!.locked).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([undefined, '9'])('returns 413 and releases the stream even when cancellation stays pending (length %s)', async (length) => {
    vi.stubEnv('PROXY_MAX_BODY_BYTES', '8');
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const source = chunkedRequest([new Uint8Array(9), new Uint8Array(1)], length ? { 'content-length': length } : undefined);
    source.cancel.mockImplementation(() => new Promise<void>(() => {}));
    expect((await POST(source.request, context(['orders']))).status).toBe(413);
    expect(source.delivered()).toBe(length ? 0 : 1);
    expect(source.cancel).toHaveBeenCalledTimes(1);
    expect(source.request.body!.locked).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns structured 400 on body read failure without contacting upstream or leaking the error', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    let pulls = 0;
    const stream = new ReadableStream<Uint8Array>({ pull(controller) {
      if (pulls++ === 0) controller.enqueue(new Uint8Array([1]));
      else controller.error(new Error('private-body-detail'));
    } }, { highWaterMark: 0 });
    const init: RequestInit & { duplex: 'half' } = { method: 'POST', body: stream, duplex: 'half' };
    const request = new Request('http://localhost/api/v1/orders', init);
    const response = await POST(request, context(['orders']));
    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error).toMatchObject({ code: 'VALIDATION_ERROR', fieldErrors: {}, traceId: expect.any(String) });
    expect(JSON.stringify(error)).not.toContain('private-body-detail');
    expect(request.body!.locked).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts a bodyless POST', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    expect((await POST(new Request('http://localhost/api/v1/admin/auth/logout', { method: 'POST' }), context(['admin', 'auth', 'logout']))).status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    { path: 'orders', limit: 1_048_576, env: 'PROXY_MAX_BODY_BYTES' },
    { path: 'admin/media', limit: 6_291_456, env: 'PROXY_MAX_MEDIA_BODY_BYTES' },
  ])('enforces the default boundary for $path even without Content-Length', async ({ path, limit, env }) => {
    vi.stubEnv(env, '');
    const fetchMock = vi.fn().mockImplementation(async () => Response.json({}));
    vi.stubGlobal('fetch', fetchMock);
    const exact = chunkedRequest([new Uint8Array(limit - 1), new Uint8Array([255])], undefined, path);
    expect((await POST(exact.request, context(path.split('/')))).status).toBe(200);
    const forwarded = new Uint8Array(fetchMock.mock.calls[0][1].body);
    expect(forwarded.byteLength).toBe(limit);
    expect(forwarded[limit - 1]).toBe(255);
    const oversized = chunkedRequest([new Uint8Array(limit), new Uint8Array([1]), new Uint8Array([2])], undefined, path);
    expect((await POST(oversized.request, context(path.split('/')))).status).toBe(413);
    expect(oversized.delivered()).toBe(2);
    expect(oversized.cancel).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(['0', '-1', 'invalid', '1.5', '9007199254740992'])('falls back from invalid limit %s for both request types', async (value) => {
    vi.stubEnv('PROXY_MAX_BODY_BYTES', value); vi.stubEnv('PROXY_MAX_MEDIA_BODY_BYTES', value);
    const fetchMock = vi.fn().mockImplementation(async () => Response.json({}));
    vi.stubGlobal('fetch', fetchMock);
    const body = new Uint8Array(1_048_577);
    expect((await POST(chunkedRequest([body]).request, context(['orders']))).status).toBe(413);
    expect((await POST(chunkedRequest([body], undefined, 'admin/media').request, context(['admin', 'media']))).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps separate configured limits and preserves multipart bytes, boundary and security headers', async () => {
    vi.stubEnv('PROXY_MAX_BODY_BYTES', '8'); vi.stubEnv('PROXY_MAX_MEDIA_BODY_BYTES', '200');
    const prefix = new TextEncoder().encode('--test-boundary\r\nContent-Disposition: form-data; name="file"; filename="oil.png"\r\nContent-Type: image/png\r\n\r\n');
    const suffix = new TextEncoder().encode('\r\n--test-boundary--\r\n');
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"code":"VALIDATION_ERROR"}', {
      status: 422, statusText: 'Invalid image', headers: { 'content-type': 'application/json', 'x-trace-id': 'backend-trace', 'set-cookie': 'JSESSIONID=new; Path=/api; HttpOnly' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const source = chunkedRequest([prefix, new Uint8Array([0, 255, 10]), suffix], {
      'content-type': 'multipart/form-data; boundary=test-boundary', cookie: 'JSESSIONID=session',
      'x-csrf-token': 'csrf', origin: 'https://shop.test', 'idempotency-key': 'key',
    }, 'admin/media');
    const response = await POST(source.request, context(['admin', 'media']));
    const init = fetchMock.mock.calls[0][1];
    expect([...new Uint8Array(init.body)]).toEqual([...prefix, 0, 255, 10, ...suffix]);
    const headers = new Headers(init.headers);
    expect(headers.get('content-type')).toBe('multipart/form-data; boundary=test-boundary');
    expect(headers.get('cookie')).toBe('JSESSIONID=session');
    expect(headers.get('x-csrf-token')).toBe('csrf');
    expect(headers.get('origin')).toBe('https://shop.test');
    expect(headers.get('idempotency-key')).toBe('key');
    expect(response.status).toBe(422);
    expect(response.statusText).toBe('Invalid image');
    expect(response.headers.get('x-trace-id')).toBe('backend-trace');
    expect(response.headers.get('set-cookie')).toBe('JSESSIONID=new; Path=/api; HttpOnly');
    expect(await response.text()).toBe('{"code":"VALIDATION_ERROR"}');
    expect((await POST(chunkedRequest([new Uint8Array(9)]).request, context(['orders']))).status).toBe(413);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('starts the existing upstream timeout after the request body has been read', async () => {
    vi.useFakeTimers(); vi.stubEnv('PROXY_TIMEOUT_MS', '20');
    const fetchMock = vi.fn().mockResolvedValue(Response.json({})); vi.stubGlobal('fetch', fetchMock);
    let input!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({ start(controller) { input = controller; } }, { highWaterMark: 0 });
    const init: RequestInit & { duplex: 'half' } = { method: 'POST', body: stream, duplex: 'half' };
    const pending = POST(new Request('http://localhost/api/v1/orders', init), context(['orders']));
    await vi.advanceTimersByTimeAsync(100);
    expect(fetchMock).not.toHaveBeenCalled();
    input.enqueue(new Uint8Array([1])); input.close();
    expect((await pending).status).toBe(200);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
  });

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

  it('keeps upstream connection failures as sanitized 503 after reading a valid body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private-connection-detail')));
    const source = chunkedRequest([new Uint8Array([1, 2])]);
    const response = await POST(source.request, context(['orders']));
    expect(response.status).toBe(503);
    const error = await response.json();
    expect(error).toMatchObject({ code: 'SERVICE_UNAVAILABLE', fieldErrors: {}, traceId: expect.any(String) });
    expect(JSON.stringify(error)).not.toContain('private-connection-detail');
    expect(source.request.body!.locked).toBe(false);
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


it('forwards only permanent product DELETE with session and CSRF headers', async () => {
  const upstream = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', upstream);
  try {
    const response = await DELETE(new Request('http://localhost/api/v1/admin/products/31', {
      method: 'DELETE', headers: { cookie: 'JSESSIONID=admin', 'x-csrf-token': 'csrf' },
    }), context(['admin', 'products', '31']));
    expect(response.status).toBe(204);
    expect(upstream.mock.calls[0][1].method).toBe('DELETE');
    const headers = new Headers(upstream.mock.calls[0][1].headers);
    expect(headers.get('cookie')).toBe('JSESSIONID=admin');
    expect(headers.get('x-csrf-token')).toBe('csrf');
    for (const path of [['products', '31'], ['admin', 'products'], ['admin', 'products', '31', 'status'], ['admin', 'categories', '21'], ['admin', 'orders', '1']]) {
      expect((await DELETE(new Request('http://localhost/api/v1/' + path.join('/'), { method: 'DELETE' }), context(path))).status).toBe(404);
    }
    expect(upstream).toHaveBeenCalledTimes(1);
  } finally { vi.unstubAllGlobals(); }
});
