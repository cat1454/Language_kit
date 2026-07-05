import { afterEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  saveRoleplayTurnResponse: vi.fn(),
  saveWritingDraft: vi.fn()
}));

vi.mock("@/src/db/repository", () => repositoryMocks);

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/roleplay-turns", () => {
  const payload = {
    lessonId: 42,
    turnId: 21,
    learnerResponse: "I have a scheduling conflict. Could we reschedule?"
  };

  it("saves a learner roleplay response for the matching lesson turn", async () => {
    repositoryMocks.saveRoleplayTurnResponse.mockResolvedValueOnce({
      id: 21,
      lessonPackId: 42,
      turnIndex: 1,
      learnerResponse: payload.learnerResponse
    });
    const { POST } = await import("@/app/api/roleplay-turns/route");

    const response = await POST(new Request("http://localhost/api/roleplay-turns", {
      method: "POST",
      body: JSON.stringify(payload)
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(repositoryMocks.saveRoleplayTurnResponse).toHaveBeenCalledWith(payload);
    expect(body.roleplayTurn).toMatchObject({
      id: 21,
      learnerResponse: payload.learnerResponse
    });
  });

  it("returns 404 when the lesson and turn do not match", async () => {
    repositoryMocks.saveRoleplayTurnResponse.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/roleplay-turns/route");

    const response = await POST(new Request("http://localhost/api/roleplay-turns", {
      method: "POST",
      body: JSON.stringify(payload)
    }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Roleplay turn not found." });
  });

  it("rejects invalid roleplay payloads", async () => {
    const { POST } = await import("@/app/api/roleplay-turns/route");

    const response = await POST(new Request("http://localhost/api/roleplay-turns", {
      method: "POST",
      body: JSON.stringify({ lessonId: 42, turnId: 21, learnerResponse: "" })
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid roleplay turn payload.");
    expect(body.issues).toEqual(expect.any(Array));
  });
});

describe("POST /api/writing-submissions", () => {
  const payload = {
    lessonId: 42,
    writingSubmissionId: 31,
    draft: "Sorry for the inconvenience. Would Friday at 3 work for you?"
  };

  it("saves a writing draft for the matching lesson submission", async () => {
    repositoryMocks.saveWritingDraft.mockResolvedValueOnce({
      id: 31,
      lessonPackId: 42,
      draft: payload.draft
    });
    const { POST } = await import("@/app/api/writing-submissions/route");

    const response = await POST(new Request("http://localhost/api/writing-submissions", {
      method: "POST",
      body: JSON.stringify(payload)
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(repositoryMocks.saveWritingDraft).toHaveBeenCalledWith(payload);
    expect(body.writingSubmission).toMatchObject({
      id: 31,
      draft: payload.draft
    });
  });

  it("returns 404 when the lesson and writing submission do not match", async () => {
    repositoryMocks.saveWritingDraft.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/writing-submissions/route");

    const response = await POST(new Request("http://localhost/api/writing-submissions", {
      method: "POST",
      body: JSON.stringify(payload)
    }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Writing submission not found." });
  });

  it("rejects invalid writing payloads", async () => {
    const { POST } = await import("@/app/api/writing-submissions/route");

    const response = await POST(new Request("http://localhost/api/writing-submissions", {
      method: "POST",
      body: JSON.stringify({ lessonId: 42, writingSubmissionId: 31, draft: "" })
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid writing submission payload.");
    expect(body.issues).toEqual(expect.any(Array));
  });
});
