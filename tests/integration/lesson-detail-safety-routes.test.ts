import { afterEach, describe, expect, it, vi } from "vitest";
import { validLessonPack } from "@/src/demo/lesson-pack-fixture";

const repositoryMocks = vi.hoisted(() => ({
  getLessonPackDetail: vi.fn()
}));

vi.mock("@/src/db/repository", () => repositoryMocks);

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/lesson-packs/:id safety fields", () => {
  it("includes valid audio metadata without exposing user-owned fields", async () => {
    repositoryMocks.getLessonPackDetail.mockResolvedValueOnce({
      lessonPack: {
        id: 42,
        userId: 1,
        status: "accepted",
        prompt: "prompt",
        rawAiOutput: "{}",
        validatedJson: validLessonPack,
        createdAt: new Date("2026-07-05T00:00:00.000Z")
      },
      lesson: validLessonPack,
      listeningInput: {
        id: 9,
        userId: 1,
        audioPath: "/audio/lessons/42.mp3",
        audioMetadataJson: {
          defaultVoiceId: "calm",
          variants: [
            {
              voiceId: "calm",
              label: "Calm voice",
              audioPath: "/audio/lessons/42-calm.mp3"
            }
          ],
          chunkTimings: [{ chunkIndex: 0, startMs: 0, endMs: 5000 }],
          durationMs: 65000
        }
      },
      listeningAttempts: [],
      roleplayTurns: [],
      writingSubmission: null,
      retryDrills: []
    });
    const { GET } = await import("@/app/api/lesson-packs/[id]/route");

    const response = await GET(new Request("http://localhost/api/lesson-packs/42"), {
      params: Promise.resolve({ id: "42" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.detail.listeningInput).toEqual({
      id: 9,
      audioPath: "/audio/lessons/42.mp3",
      audioMetadata: {
        defaultVoiceId: "calm",
        variants: [
          {
            voiceId: "calm",
            label: "Calm voice",
            audioPath: "/audio/lessons/42-calm.mp3"
          }
        ],
        chunkTimings: [{ chunkIndex: 0, startMs: 0, endMs: 5000 }],
        durationMs: 65000
      }
    });
    expect(JSON.stringify(body.detail)).not.toContain("userId");
  });

  it("falls back safely when audio metadata is missing or malformed", async () => {
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
      listeningInput: {
        id: 9,
        audioPath: "/audio/lessons/42.mp3",
        audioMetadataJson: { variants: [{ voiceId: "", label: "", audioPath: "" }] }
      },
      listeningAttempts: [],
      roleplayTurns: [],
      writingSubmission: null,
      retryDrills: []
    });
    const { GET } = await import("@/app/api/lesson-packs/[id]/route");

    const response = await GET(new Request("http://localhost/api/lesson-packs/42"), {
      params: Promise.resolve({ id: "42" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.detail.listeningInput).toEqual({
      id: 9,
      audioPath: "/audio/lessons/42.mp3",
      audioMetadata: null
    });
  });

  it("does not expose single-user placeholder fields in learner payloads", async () => {
    repositoryMocks.getLessonPackDetail.mockResolvedValueOnce({
      lessonPack: {
        id: 42,
        userId: 1,
        status: "accepted",
        prompt: "prompt",
        rawAiOutput: "{}",
        validatedJson: validLessonPack,
        createdAt: new Date("2026-07-05T00:00:00.000Z")
      },
      lesson: validLessonPack,
      listeningInput: {
        id: 9,
        userId: 1,
        audioPath: "/audio/lessons/42.mp3"
      },
      listeningAttempts: [{
        id: 11,
        userId: 1,
        lessonPackId: 42,
        listeningInputId: 9,
        gistAnswers: ["main idea"],
        detailAnswers: ["detail"],
        keyPhraseAnswers: ["phrase"],
        replayCount: 1,
        scoreGist: 1,
        scoreDetail: 1,
        scoreKeyPhrase: 1,
        missedDetails: [],
        createdAt: new Date("2026-07-05T00:00:00.000Z")
      }],
      roleplayTurns: [],
      writingSubmission: null,
      retryDrills: []
    });
    const { GET } = await import("@/app/api/lesson-packs/[id]/route");

    const response = await GET(new Request("http://localhost/api/lesson-packs/42"), {
      params: Promise.resolve({ id: "42" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.detail.lessonPack.userId).toBeUndefined();
    expect(body.detail.listeningInput).toEqual({
      id: 9,
      audioPath: "/audio/lessons/42.mp3",
      audioMetadata: null
    });
    expect(body.detail.listeningInput.userId).toBeUndefined();
    expect(body.detail.listeningAttempts[0].userId).toBeUndefined();
  });

  it("keeps lesson detail safe when audio path is missing", async () => {
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
      roleplayTurns: [],
      writingSubmission: null,
      retryDrills: []
    });
    const { GET } = await import("@/app/api/lesson-packs/[id]/route");

    const response = await GET(new Request("http://localhost/api/lesson-packs/42"), {
      params: Promise.resolve({ id: "42" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.detail.listeningInput).toEqual({
      id: 9,
      audioPath: null,
      audioMetadata: null
    });
  });
});
