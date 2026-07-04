import { afterEach, describe, expect, it, vi } from "vitest";
import { validLessonPack } from "@/src/demo/lesson-pack-fixture";

const repositoryMocks = vi.hoisted(() => ({
  saveLessonPackSubmission: vi.fn(async (submission) => ({
    id: 42,
    ...submission
  })),
  listLessonPacks: vi.fn(async () => [
    {
      id: 42,
      status: "accepted",
      topic: "Reschedule a meeting",
      cefrLevel: "B1",
      situation: "A workplace meeting must be moved.",
      createdAt: new Date("2026-07-04T00:00:00.000Z")
    }
  ])
}));

vi.mock("@/src/db/repository", () => ({
  saveLessonPackSubmission: repositoryMocks.saveLessonPackSubmission,
  listLessonPacks: repositoryMocks.listLessonPacks
}));

describe("POST /api/lesson-packs", () => {
  afterEach(() => {
    vi.clearAllMocks();
    repositoryMocks.saveLessonPackSubmission.mockImplementation(async (submission) => ({
      id: 42,
      ...submission
    }));
    repositoryMocks.listLessonPacks.mockResolvedValue([
      {
        id: 42,
        status: "accepted",
        topic: "Reschedule a meeting",
        cefrLevel: "B1",
        situation: "A workplace meeting must be moved.",
        createdAt: new Date("2026-07-04T00:00:00.000Z")
      }
    ]);
  });

  it("lists stored lesson packs", async () => {
    const { GET } = await import("@/app/api/lesson-packs/route");

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.lessons[0]).toMatchObject({
      topic: "Reschedule a meeting",
      status: "accepted"
    });
  });

  it("returns 500 when listing lessons fails", async () => {
    repositoryMocks.listLessonPacks.mockRejectedValueOnce(new Error("db offline"));
    const { GET } = await import("@/app/api/lesson-packs/route");

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("db offline");
  });

  it("rejects non-JSON request bodies", async () => {
    const { POST } = await import("@/app/api/lesson-packs/route");

    const response = await POST(
      new Request("http://localhost/api/lesson-packs", {
        method: "POST",
        body: "{ bad json"
      })
    );

    expect(response.status).toBe(400);
  });

  it("rejects malformed lesson-pack submissions", async () => {
    const { POST } = await import("@/app/api/lesson-packs/route");

    const response = await POST(
      new Request("http://localhost/api/lesson-packs", {
        method: "POST",
        body: JSON.stringify({ prompt: "" })
      })
    );

    expect(response.status).toBe(400);
  });

  it("validates and stores an accepted lesson pack", async () => {
    const { saveLessonPackSubmission } = await import("@/src/db/repository");
    const { POST } = await import("@/app/api/lesson-packs/route");

    const response = await POST(
      new Request("http://localhost/api/lesson-packs", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Generate lesson_pack.v1",
          rawAiOutput: JSON.stringify(validLessonPack),
          sourceMode: "manual_free_relay",
          providerOrSite: "manual",
          modelName: "unknown"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.status).toBe("accepted");
    expect(saveLessonPackSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "accepted",
        rejectionReason: null
      })
    );
  });

  it("stores contract validation failures with a rejection reason", async () => {
    const { saveLessonPackSubmission } = await import("@/src/db/repository");
    const { POST } = await import("@/app/api/lesson-packs/route");

    const response = await POST(
      new Request("http://localhost/api/lesson-packs", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Generate lesson_pack.v1",
          rawAiOutput: JSON.stringify({
            ...validLessonPack,
            post_listening: {
              ...validLessonPack.post_listening,
              chunks: validLessonPack.post_listening.chunks.slice(0, 2)
            }
          }),
          sourceMode: "manual_free_relay"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.rejectionReason).toBe("too_few_chunks");
    expect(saveLessonPackSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "rejected",
        rejectionReason: "too_few_chunks"
      })
    );
  });

  it("stores rejected AI output with a rejection reason", async () => {
    const { saveLessonPackSubmission } = await import("@/src/db/repository");
    const { POST } = await import("@/app/api/lesson-packs/route");

    const response = await POST(
      new Request("http://localhost/api/lesson-packs", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Generate lesson_pack.v1",
          rawAiOutput: "```json\n{}\n```",
          sourceMode: "manual_free_relay"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.status).toBe("rejected");
    expect(data.rejectionReason).toBe("markdown_wrapper_included");
    expect(saveLessonPackSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "rejected",
        rejectionReason: "markdown_wrapper_included"
      })
    );
  });
});
