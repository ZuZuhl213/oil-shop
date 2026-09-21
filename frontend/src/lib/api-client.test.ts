import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, apiFetch, getCsrf } from "./api-client";

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the same-origin API and returns typed JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ content: [], page: 0 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ page: number }>("/products?page=0");

    expect(result).toEqual({ content: [], page: 0 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/products?page=0",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
  });

  it("returns undefined for a successful 204 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(apiFetch("/orders/1")).resolves.toBeUndefined();
  });

  it("maps a C4 error response to ApiClientError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "VALIDATION_ERROR",
            message: "Invalid request",
            fieldErrors: { quantity: "Must be positive" },
            traceId: "trace-1",
          }),
          { status: 422, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    await expect(apiFetch("/orders")).rejects.toMatchObject({
      name: "ApiClientError",
      status: 422,
      code: "VALIDATION_ERROR",
      fieldErrors: { quantity: "Must be positive" },
      traceId: "trace-1",
    });
  });

  it("turns a network failure into a service unavailable error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    const error = await apiFetch("/categories").catch((value) => value);

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ status: 503, code: "SERVICE_UNAVAILABLE" });
  });

  it("loads CSRF metadata from the same-origin endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ token: "csrf-token" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCsrf()).resolves.toEqual({ token: "csrf-token" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/csrf",
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
