import { afterEach, describe, expect, it, vi } from "vitest";
import { buildReviewQueue } from "@/src/lib/adaptive-review";

const repositoryMocks = vi.hoisted(() => ({
  getReviewQueue: vi.fn()
}));

vi.mock("@/src/db/repository", () => repositoryMocks);

afterEach(() => {
  vi.clearAllMocks();
});

const emptyQueue = {
  items: [],
  summary: { total: 0, urgent: 0, high: 0, normal: 0, low: 0 }
};

describe("GET /api/review-queue", () => {
  it("returns 200 with a safe empty state", async () => {
    repositoryMocks.getReviewQueue.mockResolvedValueOnce(emptyQueue);
    const { GET } = await import("@/app/api/review-queue/route");

    const response = await GET(new Request("http://localhost/api/review-queue"));

    expect(response.status).toBe(200);
    expect(repositoryMocks.getReviewQueue).toHaveBeenCalledWith({ limit: 10 });
    await expect(response.json()).resolves.toEqual(emptyQueue);
  });

  it("returns deterministic seeded review items without unsafe fields", async () => {
    const seededQueue = buildReviewQueue({
      retryDrills: [{
        id: 7,
        lessonId: 42,
        lessonTitle: "Reschedule a meeting",
        instruction: "Rewrite the request politely.",
        items: ["I want change meeting."],
        errorLogId: 3,
        completedAt: null,
        createdAt: "2026-07-06T12:00:00.000Z"
      }],
      speakingAttempts: [{
        id: 9,
        lessonId: 42,
        lessonTitle: "Reschedule a meeting",
        promptType: "roleplay",
        promptRef: "Explain the conflict.",
        transcript: "Could we reschedule?",
        createdAt: "2026-07-06T11:00:00.000Z",
        audioPath: "C:\\raw-audio\\attempt.wav",
        userId: 1
      } as unknown as {
        id: number;
        lessonId: number;
        lessonTitle: string;
        promptType: string;
        promptRef: string;
        transcript: string;
        createdAt: string;
      }]
    });
    repositoryMocks.getReviewQueue.mockResolvedValueOnce(seededQueue);
    const { GET } = await import("@/app/api/review-queue/route");

    const response = await GET(
      new Request("http://localhost/api/review-queue?lessonId=42&limit=5")
    );
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(repositoryMocks.getReviewQueue).toHaveBeenCalledWith({
      lessonId: 42,
      limit: 5
    });
    expect(body.items.map((item: { id: string }) => item.id)).toEqual([
      "retry_drill:7",
      "speaking_attempt:9"
    ]);
    expect(serialized).not.toContain("userId");
    expect(serialized).not.toContain("audioPath");
    expect(serialized).not.toContain("raw-audio");
  });

  it("returns 400 for an invalid lessonId", async () => {
    const { GET } = await import("@/app/api/review-queue/route");

    const response = await GET(
      new Request("http://localhost/api/review-queue?lessonId=abc")
    );

    expect(response.status).toBe(400);
    expect(repositoryMocks.getReviewQueue).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid limit", async () => {
    const { GET } = await import("@/app/api/review-queue/route");

    const response = await GET(
      new Request("http://localhost/api/review-queue?limit=0")
    );

    expect(response.status).toBe(400);
    expect(repositoryMocks.getReviewQueue).not.toHaveBeenCalled();
  });

  it("enforces the maximum limit", async () => {
    const { GET } = await import("@/app/api/review-queue/route");

    const response = await GET(
      new Request("http://localhost/api/review-queue?limit=26")
    );

    expect(response.status).toBe(400);
    expect(repositoryMocks.getReviewQueue).not.toHaveBeenCalled();
  });

  it("rejects unknown or duplicate query parameters", async () => {
    const { GET } = await import("@/app/api/review-queue/route");

    const unknown = await GET(
      new Request("http://localhost/api/review-queue?sort=recent")
    );
    const duplicate = await GET(
      new Request("http://localhost/api/review-queue?limit=5&limit=10")
    );

    expect(unknown.status).toBe(400);
    expect(duplicate.status).toBe(400);
    expect(repositoryMocks.getReviewQueue).not.toHaveBeenCalled();
  });

  it("normalizes repository failures", async () => {
    repositoryMocks.getReviewQueue.mockRejectedValueOnce(new Error("db offline"));
    const { GET } = await import("@/app/api/review-queue/route");

    const response = await GET(new Request("http://localhost/api/review-queue"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to load review queue."
    });
  });
});
