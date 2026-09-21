import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const params = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe("same-origin API proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("proxies an allowed catalog request to the server-only backend origin", async () => {
    vi.stubEnv("BACKEND_API_ORIGIN", "https://backend.example.test/");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ content: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("http://frontend.test/api/v1/products?page=1", {
      headers: { Cookie: "SESSION=abc", Origin: "https://frontend.test" },
    });
    const response = await GET(request, params(["products"]));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ content: [] });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://backend.example.test/api/v1/products?page=1",
      expect.objectContaining({ method: "GET" }),
    );
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const forwardedHeaders = new Headers(options.headers);
    expect(forwardedHeaders.get("cookie")).toBe("SESSION=abc");
    expect(forwardedHeaders.get("origin")).toBe("https://frontend.test");
  });

  it("preserves multiple Set-Cookie headers from the backend", async () => {
    const upstream = new Response(null, { status: 204 });
    Object.defineProperty(upstream.headers, "getSetCookie", {
      value: () => ["SESSION=abc; Path=/", "XSRF=def; Path=/"],
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(upstream));

    const response = await POST(
      new Request("http://frontend.test/api/v1/admin/auth/login", {
        method: "POST",
        body: "{}",
        headers: { "Content-Type": "application/json" },
      }),
      params(["admin", "auth", "login"]),
    );

    expect(response.status).toBe(204);
    expect(response.headers.getSetCookie()).toEqual(["SESSION=abc; Path=/", "XSRF=def; Path=/"]);
  });

  it("forwards mutation body and CSRF headers without exposing the upstream URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "VOUCHER_INVALID" }), { status: 422, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://frontend.test/api/v1/vouchers/validate", {
        method: "POST",
        body: JSON.stringify({ code: "SAVE10", items: [] }),
        headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": "token-1", Origin: "https://frontend.test" },
      }),
      params(["vouchers", "validate"]),
    );

    expect(response.status).toBe(422);
    const [upstreamUrl, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(upstreamUrl).toBe("http://localhost:8080/api/v1/vouchers/validate");
    expect(await new Response(options.body).text()).toBe(JSON.stringify({ code: "SAVE10", items: [] }));
    const forwardedHeaders = new Headers(options.headers);
    expect(forwardedHeaders.get("x-csrf-token")).toBe("token-1");
    expect(forwardedHeaders.get("origin")).toBe("https://frontend.test");
  });

  it("rejects paths outside the proxy allowlist", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(new Request("http://frontend.test/api/v1/internal/secrets"), params(["internal", "secrets"]));

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a standard 503 when the backend times out", async () => {
    vi.stubEnv("PROXY_TIMEOUT_MS", "1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_input, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
      ),
    );

    const response = await GET(new Request("http://frontend.test/api/v1/categories"), params(["categories"]));

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
});
