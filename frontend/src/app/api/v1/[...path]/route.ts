import { randomUUID } from 'node:crypto';
import { readRequestBody, RequestBodyTooLargeError } from './request-body';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ path?: string[] }> | { path?: string[] } };

const DEFAULT_MAX_BODY_BYTES = 1_048_576;
const DEFAULT_MAX_MEDIA_BODY_BYTES = 6 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 10_000;
const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'content-type',
  'cookie',
  'idempotency-key',
  'origin',
  'x-csrf-token',
];
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'transfer-encoding',
]);

function upstreamOrigin(): string {
  return (process.env.BACKEND_API_ORIGIN ?? 'http://localhost:8080').replace(/\/$/, '');
}

function routeRule(path: string, method: string): boolean {
  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod === 'DELETE') return /^admin\/products\/[^/]+$/.test(path);
  if (path === 'categories') return normalizedMethod === 'GET';
  if (path === 'products' || /^products\/[^/]+$/.test(path)) {
    return normalizedMethod === 'GET';
  }
  if (path === 'health') return normalizedMethod === 'GET';
  if (path === 'csrf') return normalizedMethod === 'GET';
  if (path === 'vouchers/validate' || path === 'orders' || path === 'orders/tracking') return normalizedMethod === 'POST';
  if (path === 'admin/auth/login') return normalizedMethod === 'POST';
  if (path === 'admin/auth/me') return normalizedMethod === 'GET';
  if (path === 'admin/auth/logout') return normalizedMethod === 'POST';
  if (path === 'admin/media') return normalizedMethod === 'POST';
  if (/^admin\/(categories|products|vouchers|orders)(\/[^/]+)?(\/status|\/note)?$/.test(path)) {
    return ['GET', 'POST', 'PUT', 'PATCH'].includes(normalizedMethod);
  }
  if (/^admin\/products\/[^/]+\/variants$/.test(path)) return normalizedMethod === 'POST';
  if (/^admin\/variants\/[^/]+$/.test(path)) return normalizedMethod === 'PUT';
  if (/^admin\/variants\/[^/]+\/status$/.test(path)) return normalizedMethod === 'PATCH';
  return false;
}

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json(
    { code, message, fieldErrors: {}, traceId: randomUUID() },
    { status },
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

async function routePath(context: RouteContext): Promise<string> {
  const params = await context.params;
  const segments = params.path ?? [];
  if (
    segments.length === 0 ||
    segments.some(
      (segment) =>
        !segment ||
        segment === '.' ||
        segment === '..' ||
        segment.includes('/'),
    )
  ) {
    throw new Error('Invalid proxy path');
  }
  return segments.join('/');
}

async function proxy(request: Request, context: RouteContext): Promise<Response> {
  let path: string;
  try {
    path = await routePath(context);
  } catch {
    return errorResponse(404, 'NOT_FOUND', 'Resource not found');
  }

  const method = request.method.toUpperCase();
  if (method === 'OPTIONS') {
    return routeRule(path, 'GET') || routeRule(path, 'POST')
      ? new Response(null, {
          status: 204,
          headers: { Allow: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
        })
      : errorResponse(404, 'NOT_FOUND', 'Resource not found');
  }

  if (!routeRule(path, method)) {
    return errorResponse(404, 'NOT_FOUND', 'Resource not found');
  }

  const defaultLimit = path === 'admin/media' ? DEFAULT_MAX_MEDIA_BODY_BYTES : DEFAULT_MAX_BODY_BYTES;
  const configuredLimit = Number(path === 'admin/media' ? process.env.PROXY_MAX_MEDIA_BODY_BYTES ?? defaultLimit : process.env.PROXY_MAX_BODY_BYTES ?? defaultLimit);
  const maxBodyBytes = Number.isSafeInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : defaultLimit;
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    void request.body?.cancel().catch(() => {});
    return errorResponse(413, 'REQUEST_TOO_LARGE', 'Request body is too large');
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  let body: ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(method)) {
    try {
      body = await readRequestBody(request, maxBodyBytes);
    } catch (error) {
      return error instanceof RequestBodyTooLargeError
        ? errorResponse(413, 'REQUEST_TOO_LARGE', 'Request body is too large')
        : errorResponse(400, 'VALIDATION_ERROR', 'The request body could not be read');
    }
  }

  const controller = new AbortController();
  const parsedTimeout = Number(process.env.PROXY_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const timeoutMs =
    Number.isFinite(parsedTimeout) && parsedTimeout > 0
      ? parsedTimeout
      : DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let upstream: Response;
  let responseBody: ArrayBuffer | null;
  try {
    upstream = await fetch(
      upstreamOrigin() + '/api/v1/' + path + new URL(request.url).search,
      {
        method,
        headers,
        body,
        signal: controller.signal,
        redirect: 'manual',
        cache: 'no-store',
      },
    );
    responseBody = upstream.body === null ? null : await upstream.arrayBuffer();
  } catch (error) {
    return errorResponse(
      503,
      'SERVICE_UNAVAILABLE',
      isAbortError(error) ? 'The backend timed out' : 'The backend is unavailable',
    );
  } finally {
    clearTimeout(timeout);
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, name) => {
    if (!HOP_BY_HOP_HEADERS.has(name) && name !== 'set-cookie') {
      responseHeaders.set(name, value);
    }
  });

  const setCookies =
    typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : upstream.headers.get('set-cookie')
        ? [upstream.headers.get('set-cookie') as string]
        : [];
  for (const cookie of setCookies) responseHeaders.append('set-cookie', cookie);

  if (method !== 'GET' || path.startsWith('admin/') || path === 'csrf') {
    responseHeaders.set('cache-control', 'no-store');
  }

  return new Response(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export function GET(request: Request, context: RouteContext) {
  return proxy(request, context);
}
export function POST(request: Request, context: RouteContext) {
  return proxy(request, context);
}
export function PUT(request: Request, context: RouteContext) {
  return proxy(request, context);
}
export function PATCH(request: Request, context: RouteContext) {
  return proxy(request, context);
}
export function DELETE(request: Request, context: RouteContext) {
  return proxy(request, context);
}
export function OPTIONS(request: Request, context: RouteContext) {
  return proxy(request, context);
}
