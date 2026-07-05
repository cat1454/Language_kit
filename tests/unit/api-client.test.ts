import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  isBackendUnavailable,
  requestJson
} from "@/src/lib/api-client";

describe("API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON for successful responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ value: 42 }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    ));

    await expect(requestJson<{ value: number }>("/api/example")).resolves.toEqual({
      value: 42
    });
  });

  it("throws an ApiError with the server message for non-ok responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: "Invalid request." }), {
        status: 400,
        headers: { "content-type": "application/json" }
      })
    ));

    const error: unknown = await requestJson("/api/example").catch(
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, message: "Invalid request." });
    expect(isBackendUnavailable(error)).toBe(false);
  });

  it("classifies 5xx and network failures as backend unavailable", async () => {
    expect(isBackendUnavailable(new ApiError(503, "Unavailable"))).toBe(true);
    expect(isBackendUnavailable(new TypeError("fetch failed"))).toBe(true);
  });

  it("preserves successful plain-text responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ready", { status: 200 })));

    await expect(requestJson<string>("/api/example")).resolves.toBe("ready");
  });

  it("falls back to the HTTP status when an error response is empty", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 502 })));

    await expect(requestJson("/api/example")).rejects.toMatchObject({
      status: 502,
      message: "Request failed with status 502."
    });
  });
});
