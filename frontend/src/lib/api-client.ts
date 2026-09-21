import type { ApiError, CsrfResponse } from "./api-types";

const API_PREFIX = "/api/v1";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string>;
  readonly traceId?: string;

  constructor(status: number, error: Partial<ApiError>, cause?: unknown) {
    super(error.message ?? "Request failed", { cause });
    this.name = "ApiClientError";
    this.status = status;
    this.code = error.code ?? "REQUEST_FAILED";
    this.fieldErrors = error.fieldErrors ?? {};
    this.traceId = error.traceId;
  }
}

function sameOriginPath(path: string): string {
  if (/^https?:\/\//i.test(path) || path.startsWith("//")) {
    throw new Error("apiFetch only accepts same-origin paths");
  }
  if (path === API_PREFIX || path.startsWith(`${API_PREFIX}/`)) {
    return path;
  }
  return `${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    return undefined;
  }
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", headers.get("Accept") ?? "application/json");
  let body = init.body;
  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)) {
    body = JSON.stringify(body);
    headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  }

  let response: Response;
  try {
    response = await fetch(sameOriginPath(path), {
      ...init,
      body,
      headers,
      cache: init.cache ?? "no-store",
      credentials: init.credentials ?? "include",
    });
  } catch (cause) {
    throw new ApiClientError(503, {
      code: "SERVICE_UNAVAILABLE",
      message: "The service is temporarily unavailable",
      fieldErrors: {},
    }, cause);
  }

  if (response.status === 204) return undefined as T;
  const payload = await readJson(response);
  if (!response.ok) {
    const error = (payload && typeof payload === "object" ? payload : {}) as Partial<ApiError>;
    throw new ApiClientError(response.status, {
      code: error.code ?? "REQUEST_FAILED",
      message: error.message ?? `Request failed with status ${response.status}`,
      fieldErrors: error.fieldErrors ?? {},
      traceId: error.traceId,
    });
  }
  return payload as T;
}

export function getCsrf(): Promise<CsrfResponse> {
  return apiFetch<CsrfResponse>("/csrf");
}
