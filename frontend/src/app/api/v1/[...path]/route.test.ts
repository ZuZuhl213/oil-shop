import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET, OPTIONS, POST } from './route';

const context = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe('API proxy route', () => {
  afterEach(() => vi.unstubAllGlobals());

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
