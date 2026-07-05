import { afterEach, describe, expect, it, vi } from "vitest";
import { validFeedback } from "@/src/demo/lesson-pack-fixture";

const repositoryMocks = vi.hoisted(() => ({
  saveListeningAttempt: vi.fn(),
  saveFeedback: vi.fn(),
  completeRetryDrill: vi.fn()
}));

vi.mock("@/src/db/repository", () => repositoryMocks);

afterEach(() => {
  vi.clearAllMocks();
});

describe("hardening API contracts", () => {
  it("returns structured listening validation errors", async () => {
    const { POST } = await import("@/app/api/listening-attempts/route");

    const response = await POST(new Request("http://localhost/api/listening-attempts", {
      method: "POST",
      body: JSON.stringify({ lessonPackId: 42 })
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid listening attempt payload.");
    expect(body.issues).toEqual(expect.any(Array));
  });

  it("returns structured feedback validation errors", async () => {
    const { POST } = await import("@/app/api/feedback/route");

    const response = await POST(new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({ lessonPackId: 42, prompt: "Evaluate" })
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid feedback submission payload.");
    expect(body.issues).toEqual(expect.any(Array));
  });

  it("returns 404 when feedback targets a missing lesson", async () => {
    repositoryMocks.saveFeedback.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/feedback/route");

    const response = await POST(new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        lessonPackId: 999,
        prompt: "Evaluate",
        rawAiOutput: JSON.stringify(validFeedback),
        sourceMode: "manual_free_relay"
      })
    }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Lesson not found." });
  });

  it("keeps generic 500 feedback responses for non-not-found failures", async () => {
    repositoryMocks.saveFeedback.mockRejectedValueOnce(new Error("db offline"));
    const { POST } = await import("@/app/api/feedback/route");

    const response = await POST(new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        lessonPackId: 42,
        prompt: "Evaluate",
        rawAiOutput: JSON.stringify(validFeedback),
        sourceMode: "manual_free_relay"
      })
    }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to save feedback." });
  });

  it("returns structured retry completion validation errors", async () => {
    const { POST } = await import("@/app/api/retry-drills/[id]/complete/route");

    const response = await POST(
      new Request("http://localhost/api/retry-drills/7/complete", {
        method: "POST",
        body: JSON.stringify({ learnerResult: "" })
      }),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid retry drill completion payload.");
    expect(body.issues).toEqual(expect.any(Array));
  });

  it("keeps clear retry errors for invalid path ids", async () => {
    const { POST } = await import("@/app/api/retry-drills/[id]/complete/route");

    const response = await POST(
      new Request("http://localhost/api/retry-drills/nope/complete", {
        method: "POST",
        body: JSON.stringify({ learnerResult: "Corrected answer" })
      }),
      { params: Promise.resolve({ id: "nope" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid retry drill id." });
  });
});
