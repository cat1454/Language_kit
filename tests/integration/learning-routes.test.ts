import { afterEach, describe, expect, it, vi } from "vitest";
import { validFeedback, validLessonPack } from "@/src/demo/lesson-pack-fixture";

const repositoryMocks = vi.hoisted(() => ({
  getLessonPackDetail: vi.fn(),
  getDashboardSummary: vi.fn(),
  saveListeningAttempt: vi.fn(),
  saveFeedback: vi.fn(),
  saveRejectedFeedbackOutput: vi.fn(),
  completeRetryDrill: vi.fn()
}));

vi.mock("@/src/db/repository", () => repositoryMocks);

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/lesson-packs/:id", () => {
  it("returns a normalized lesson detail", async () => {
    repositoryMocks.getLessonPackDetail.mockResolvedValueOnce({
      lessonPack: {
        id: 42,
        status: "accepted",
        prompt: "prompt",
        rawAiOutput: "{}",
        validatedJson: validLessonPack,
        createdAt: new Date("2026-07-05T00:00:00.000Z")
      },
      lesson: validLessonPack,
      listeningInput: { id: 9 },
      listeningAttempts: [],
      roleplayTurns: [{
        id: 21,
        lessonPackId: 42,
        turnIndex: 1,
        aiPrompt: "Ask me why I want to move the meeting.",
        learnerGoal: "Explain the conflict politely.",
        learnerResponse: "I have a scheduling conflict. Could we reschedule?"
      }],
      writingSubmission: {
        id: 31,
        lessonPackId: 42,
        task: validLessonPack.writing_task.task,
        constraintsJson: validLessonPack.writing_task.constraints,
        targetChunksJson: validLessonPack.writing_task.target_chunks_to_use,
        draft: "Sorry for the inconvenience. Would Friday at 3 work for you?"
      },
      retryDrills: [{
        id: 7,
        lessonPackId: 42,
        instruction: "Try again",
        itemsJson: ["One"],
        learnerResult: null,
        completedAt: null
      }]
    });
    const { GET } = await import("@/app/api/lesson-packs/[id]/route");

    const response = await GET(new Request("http://localhost/api/lesson-packs/42"), {
      params: Promise.resolve({ id: "42" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.detail.listeningInputId).toBe(9);
    expect(body.detail.roleplayTurns[0]).toMatchObject({
      id: 21,
      learnerResponse: "I have a scheduling conflict. Could we reschedule?"
    });
    expect(body.detail.writingSubmission).toMatchObject({
      id: 31,
      draft: "Sorry for the inconvenience. Would Friday at 3 work for you?"
    });
    expect(body.detail.retryDrills[0]).toMatchObject({ items: ["One"] });
    expect(body.detail.lessonPack.createdAt).toBe("2026-07-05T00:00:00.000Z");
  });

  it("returns 400 for invalid ids and 404 for missing lessons", async () => {
    const { GET } = await import("@/app/api/lesson-packs/[id]/route");
    const invalid = await GET(new Request("http://localhost/api/lesson-packs/nope"), {
      params: Promise.resolve({ id: "nope" })
    });
    repositoryMocks.getLessonPackDetail.mockResolvedValueOnce(null);
    const missing = await GET(new Request("http://localhost/api/lesson-packs/404"), {
      params: Promise.resolve({ id: "404" })
    });

    expect(invalid.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  it("returns 500 when detail persistence fails", async () => {
    repositoryMocks.getLessonPackDetail.mockRejectedValueOnce(new Error("db offline"));
    const { GET } = await import("@/app/api/lesson-packs/[id]/route");
    const response = await GET(new Request("http://localhost/api/lesson-packs/42"), {
      params: Promise.resolve({ id: "42" })
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: "Failed to load lesson." });
  });
});

describe("GET /api/dashboard", () => {
  it("returns the persisted progress summary", async () => {
    repositoryMocks.getDashboardSummary.mockResolvedValueOnce({
      completedTopics: 2,
      completedRetryDrills: 1,
      repeatedErrorTypes: { grammar: 3 }
    });
    const { GET } = await import("@/app/api/dashboard/route");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      summary: {
        completedTopics: 2,
        completedRetryDrills: 1,
        repeatedErrorTypes: { grammar: 3 }
      }
    });
  });

  it("returns 500 when dashboard persistence fails", async () => {
    repositoryMocks.getDashboardSummary.mockRejectedValueOnce(new Error("db offline"));
    const { GET } = await import("@/app/api/dashboard/route");

    const response = await GET();

    expect(response.status).toBe(500);
  });
});

describe("POST /api/listening-attempts", () => {
  const payload = {
    lessonPackId: 42,
    gistAnswers: ["Reschedule a meeting"],
    detailAnswers: ["A conflict"],
    keyPhraseAnswers: ["Could we reschedule it"],
    replayCount: 2,
    scoreGist: 1,
    scoreDetail: 0.5,
    scoreKeyPhrase: 1,
    missedDetails: ["new time"]
  };

  it("accepts the public payload without a listeningInputId", async () => {
    repositoryMocks.saveListeningAttempt.mockResolvedValueOnce({ id: 11, ...payload });
    const { POST } = await import("@/app/api/listening-attempts/route");

    const response = await POST(new Request("http://localhost/api/listening-attempts", {
      method: "POST",
      body: JSON.stringify(payload)
    }));

    expect(response.status).toBe(201);
    expect(repositoryMocks.saveListeningAttempt).toHaveBeenCalledWith(payload);
  });

  it("returns 404 when the lesson has no listening input", async () => {
    repositoryMocks.saveListeningAttempt.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/listening-attempts/route");
    const response = await POST(new Request("http://localhost/api/listening-attempts", {
      method: "POST",
      body: JSON.stringify(payload)
    }));

    expect(response.status).toBe(404);
  });

  it("rejects malformed JSON and normalizes repository failures", async () => {
    const { POST } = await import("@/app/api/listening-attempts/route");
    const malformed = await POST(new Request("http://localhost/api/listening-attempts", {
      method: "POST",
      body: "{ bad json"
    }));
    repositoryMocks.saveListeningAttempt.mockRejectedValueOnce(new Error("db offline"));
    const failed = await POST(new Request("http://localhost/api/listening-attempts", {
      method: "POST",
      body: JSON.stringify(payload)
    }));

    expect(malformed.status).toBe(400);
    expect(failed.status).toBe(500);
  });
});

describe("POST /api/feedback", () => {
  it("returns the server-validated feedback", async () => {
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
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.feedback).toEqual(validFeedback);
  });

  it("rejects invalid feedback and returns 500 for persistence failures", async () => {
    const { POST } = await import("@/app/api/feedback/route");
    repositoryMocks.saveRejectedFeedbackOutput.mockResolvedValueOnce({ modelOutputId: 10 });
    const invalid = await POST(new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        lessonPackId: 42,
        prompt: "Evaluate",
        rawAiOutput: "{}",
        sourceMode: "manual_free_relay"
      })
    }));
    repositoryMocks.saveFeedback.mockRejectedValueOnce(new Error("db offline"));
    const failed = await POST(new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        lessonPackId: 42,
        prompt: "Evaluate",
        rawAiOutput: JSON.stringify(validFeedback),
        sourceMode: "manual_free_relay"
      })
    }));

    expect(invalid.status).toBe(422);
    expect(failed.status).toBe(500);
  });
});

describe("POST /api/retry-drills/:id/complete", () => {
  it("completes the drill through the /complete endpoint", async () => {
    repositoryMocks.completeRetryDrill.mockResolvedValueOnce({
      id: 9,
      learnerResult: "Corrected answer",
      completedAt: new Date("2026-07-05T00:00:00.000Z")
    });
    const { POST } = await import("@/app/api/retry-drills/[id]/complete/route");
    const response = await POST(
      new Request("http://localhost/api/retry-drills/9/complete", {
        method: "POST",
        body: JSON.stringify({ learnerResult: "Corrected answer" })
      }),
      { params: Promise.resolve({ id: "9" }) }
    );

    expect(response.status).toBe(200);
    expect(repositoryMocks.completeRetryDrill).toHaveBeenCalledWith(9, "Corrected answer");
  });

  it("returns 404 instead of silently succeeding for a missing drill", async () => {
    repositoryMocks.completeRetryDrill.mockResolvedValueOnce(undefined);
    const { POST } = await import("@/app/api/retry-drills/[id]/complete/route");
    const response = await POST(
      new Request("http://localhost/api/retry-drills/9/complete", {
        method: "POST",
        body: JSON.stringify({ learnerResult: "Corrected answer" })
      }),
      { params: Promise.resolve({ id: "9" }) }
    );

    expect(response.status).toBe(404);
  });

  it("returns 400 for malformed JSON and 500 for repository failures", async () => {
    const { POST } = await import("@/app/api/retry-drills/[id]/complete/route");
    const malformed = await POST(
      new Request("http://localhost/api/retry-drills/9/complete", {
        method: "POST",
        body: "{ bad json"
      }),
      { params: Promise.resolve({ id: "9" }) }
    );
    repositoryMocks.completeRetryDrill.mockRejectedValueOnce(new Error("db offline"));
    const failed = await POST(
      new Request("http://localhost/api/retry-drills/9/complete", {
        method: "POST",
        body: JSON.stringify({ learnerResult: "Corrected answer" })
      }),
      { params: Promise.resolve({ id: "9" }) }
    );

    expect(malformed.status).toBe(400);
    expect(failed.status).toBe(500);
  });
});
