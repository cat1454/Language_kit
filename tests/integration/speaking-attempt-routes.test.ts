import { afterEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  saveSpeakingAttempt: vi.fn()
}));

vi.mock("@/src/db/repository", () => repositoryMocks);

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/speaking-attempts", () => {
  const payload = {
    lessonId: 42,
    promptType: "roleplay",
    promptRef: "Ask to move the meeting politely.",
    transcript: "Could we reschedule for Friday?"
  };

  it("saves a manual transcript and excludes the user placeholder", async () => {
    repositoryMocks.saveSpeakingAttempt.mockResolvedValueOnce({
      id: 81,
      userId: 1,
      lessonPackId: 42,
      promptType: payload.promptType,
      promptRef: payload.promptRef,
      audioPath: null,
      transcript: payload.transcript,
      sttProvider: "manual",
      sttStatus: "completed",
      createdAt: new Date("2026-07-05T00:00:00.000Z"),
      updatedAt: null
    });
    const { POST } = await import("@/app/api/speaking-attempts/route");

    const response = await POST(new Request("http://localhost/api/speaking-attempts", {
      method: "POST",
      body: JSON.stringify(payload)
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(repositoryMocks.saveSpeakingAttempt).toHaveBeenCalledWith({
      lessonPackId: 42,
      promptType: payload.promptType,
      promptRef: payload.promptRef,
      transcript: payload.transcript,
      sttProvider: "manual",
      sttStatus: "completed"
    });
    expect(body).toEqual({
      attempt: {
        id: 81,
        lessonId: 42,
        promptType: payload.promptType,
        promptRef: payload.promptRef,
        transcript: payload.transcript,
        sttProvider: "manual",
        sttStatus: "completed",
        createdAt: "2026-07-05T00:00:00.000Z"
      }
    });
    expect(JSON.stringify(body)).not.toContain("userId");
  });

  it("returns 400 for invalid input", async () => {
    const { POST } = await import("@/app/api/speaking-attempts/route");
    const response = await POST(new Request("http://localhost/api/speaking-attempts", {
      method: "POST",
      body: JSON.stringify({ ...payload, transcript: "" })
    }));

    expect(response.status).toBe(400);
    expect(repositoryMocks.saveSpeakingAttempt).not.toHaveBeenCalled();
  });

  it("returns 404 when the lesson does not exist", async () => {
    repositoryMocks.saveSpeakingAttempt.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/speaking-attempts/route");
    const response = await POST(new Request("http://localhost/api/speaking-attempts", {
      method: "POST",
      body: JSON.stringify(payload)
    }));

    expect(response.status).toBe(404);
  });

  it("rejects malformed JSON and normalizes repository failures", async () => {
    const { POST } = await import("@/app/api/speaking-attempts/route");
    const malformed = await POST(new Request("http://localhost/api/speaking-attempts", {
      method: "POST",
      body: "{ bad json"
    }));
    repositoryMocks.saveSpeakingAttempt.mockRejectedValueOnce(new Error("db offline"));
    const failed = await POST(new Request("http://localhost/api/speaking-attempts", {
      method: "POST",
      body: JSON.stringify(payload)
    }));

    expect(malformed.status).toBe(400);
    expect(failed.status).toBe(500);
    await expect(failed.json()).resolves.toEqual({ error: "Failed to save speaking attempt." });
  });
});
