import { afterEach, describe, expect, it, vi } from "vitest";
import { validFeedback } from "@/src/demo/lesson-pack-fixture";

const repositoryMocks = vi.hoisted(() => ({
  saveFeedback: vi.fn(),
  saveRejectedFeedbackOutput: vi.fn()
}));

vi.mock("@/src/db/repository", () => repositoryMocks);

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/feedback persistence hardening", () => {
  it("saves accepted feedback through the accepted feedback path only", async () => {
    repositoryMocks.saveFeedback.mockResolvedValueOnce({
      modelOutputId: 4,
      errorCount: 1,
      retryDrillId: 8
    });
    const { POST } = await import("@/app/api/feedback/route");

    const response = await POST(new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        lessonPackId: 42,
        prompt: "Evaluate this learner",
        rawAiOutput: JSON.stringify(validFeedback),
        sourceMode: "manual_free_relay"
      })
    }));

    expect(response.status).toBe(201);
    expect(repositoryMocks.saveFeedback).toHaveBeenCalledWith({
      lessonPackId: 42,
      prompt: "Evaluate this learner",
      rawAiOutput: JSON.stringify(validFeedback),
      sourceMode: "manual_free_relay",
      feedback: validFeedback
    });
    expect(repositoryMocks.saveRejectedFeedbackOutput).not.toHaveBeenCalled();
  });

  it("stores invalid feedback JSON as a rejected model output", async () => {
    repositoryMocks.saveRejectedFeedbackOutput.mockResolvedValueOnce({ modelOutputId: 12 });
    const { POST } = await import("@/app/api/feedback/route");

    const response = await POST(new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        lessonPackId: 42,
        prompt: "Evaluate",
        rawAiOutput: "{ bad json",
        sourceMode: "manual_free_relay"
      })
    }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      status: "rejected",
      rejectionReason: "invalid_json"
    });
    expect(repositoryMocks.saveRejectedFeedbackOutput).toHaveBeenCalledWith(expect.objectContaining({
      lessonPackId: 42,
      prompt: "Evaluate",
      rawAiOutput: "{ bad json",
      parsedJson: null,
      rejectionReason: "invalid_json",
      sourceMode: "manual_free_relay"
    }));
    expect(repositoryMocks.saveFeedback).not.toHaveBeenCalled();
  });

  it("stores schema-invalid feedback with parsed JSON for later repair", async () => {
    repositoryMocks.saveRejectedFeedbackOutput.mockResolvedValueOnce({ modelOutputId: 13 });
    const parsedJson = { scores: validFeedback.scores };
    const { POST } = await import("@/app/api/feedback/route");

    const response = await POST(new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        lessonPackId: 42,
        prompt: "Evaluate",
        rawAiOutput: JSON.stringify(parsedJson),
        sourceMode: "manual_free_relay"
      })
    }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.rejectionReason).toBe("feedback_lacks_retry_drill");
    expect(repositoryMocks.saveRejectedFeedbackOutput).toHaveBeenCalledWith(expect.objectContaining({
      parsedJson,
      rejectionReason: "feedback_lacks_retry_drill"
    }));
    expect(repositoryMocks.saveFeedback).not.toHaveBeenCalled();
  });

  it("returns 404 when rejected feedback targets a missing lesson", async () => {
    repositoryMocks.saveRejectedFeedbackOutput.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/feedback/route");

    const response = await POST(new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        lessonPackId: 999,
        prompt: "Evaluate",
        rawAiOutput: "{ bad json",
        sourceMode: "manual_free_relay"
      })
    }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Lesson not found." });
  });
});
