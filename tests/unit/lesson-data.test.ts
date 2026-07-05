import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearSessionDataSource,
  getSessionDataSource,
  setSessionDataSource
} from "@/src/lib/lesson-data";

describe("session data source", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null outside the browser", () => {
    expect(getSessionDataSource()).toBeNull();
  });

  it("stores, reads, and clears a valid pinned source", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key)
      }
    });

    expect(getSessionDataSource()).toBeNull();
    setSessionDataSource("demo");
    expect(getSessionDataSource()).toBe("demo");
    clearSessionDataSource();
    expect(getSessionDataSource()).toBeNull();
  });

  it("ignores unknown stored values", () => {
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: () => "legacy",
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
    });

    expect(getSessionDataSource()).toBeNull();
  });
});
