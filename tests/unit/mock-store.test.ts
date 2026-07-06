import { beforeEach, describe, expect, it } from "vitest";
import { validFeedback, validLessonPack } from "@/src/demo/lesson-pack-fixture";
import {
  mockCompleteRetryDrill,
  mockGetDashboardSummary,
  mockGetLessonDetail,
  mockGetLessons,
  mockSaveLesson,
  mockSaveListeningAttempt,
  mockSaveWritingFeedback
} from "@/src/lib/mockStore";
import { mockGetReviewQueue } from "@/src/lib/mock-review-store";

const STORAGE_KEY = "language_kit_mock_db";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const storage = new MemoryStorage();

beforeEach(() => {
  storage.clear();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {}
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage
  });
});

describe("browser demo store", () => {
  it("initializes and reads the default lessons", () => {
    const lessons = mockGetLessons();

    expect(lessons).toHaveLength(2);
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(mockGetLessonDetail(101)?.lesson.topic).toBe(
      "Meeting schedule adjustment"
    );
    expect(mockGetLessonDetail(999_999)).toBeNull();
  });

  it("falls back to defaults when cached JSON is malformed", () => {
    storage.setItem(STORAGE_KEY, "{broken-json");

    expect(mockGetLessons()).toHaveLength(2);
  });

  it("saves a lesson and its generated retry drills", () => {
    storage.setItem(STORAGE_KEY, "[]");

    const saved = mockSaveLesson("prompt", JSON.stringify(validLessonPack), validLessonPack);
    const detail = mockGetLessonDetail(saved.id);

    expect(saved).toMatchObject({
      id: 101,
      status: "accepted",
      topic: validLessonPack.topic
    });
    expect(detail?.retryDrills).toHaveLength(validLessonPack.retry_drills.length);
    expect(mockGetDashboardSummary().completedTopics).toBe(1);
  });

  it("stores listening attempts and rejects an unknown lesson", () => {
    storage.setItem(STORAGE_KEY, "[]");
    const lesson = mockSaveLesson("prompt", "{}", validLessonPack);
    const attemptInput = {
      gistAnswers: ["A meeting is being moved."],
      detailAnswers: ["A scheduling conflict."],
      keyPhraseAnswers: ["Could we reschedule it?"],
      replayCount: 2,
      scoreGist: 1,
      scoreDetail: 0.5,
      scoreKeyPhrase: 1,
      missedDetails: ["The proposed time."]
    };

    const attempt = mockSaveListeningAttempt(lesson.id, attemptInput);

    expect(attempt).toMatchObject({ lessonPackId: lesson.id, replayCount: 2 });
    expect(mockGetLessonDetail(lesson.id)?.listeningAttempts).toHaveLength(1);
    expect(() => mockSaveListeningAttempt(999_999, attemptInput)).toThrow(
      "Lesson not found"
    );
  });

  it("stores feedback, summarizes errors, and completes a retry drill", () => {
    storage.setItem(STORAGE_KEY, "[]");
    const lesson = mockSaveLesson("prompt", "{}", validLessonPack);

    expect(mockSaveWritingFeedback(lesson.id, validFeedback)).toEqual({
      errorCount: validFeedback.error_log_items.length,
      drillCount: 1
    });

    const detail = mockGetLessonDetail(lesson.id);
    const feedbackDrill = detail?.retryDrills.at(-1);
    expect(feedbackDrill).toBeDefined();

    const completed = mockCompleteRetryDrill(
      lesson.id,
      feedbackDrill?.id ?? 0,
      "Corrected answer"
    );
    const summary = mockGetDashboardSummary();

    expect(completed?.learnerResult).toBe("Corrected answer");
    expect(summary.completedRetryDrills).toBe(1);
    expect(summary.repeatedErrorTypes.naturalness).toBe(1);
    expect(() => mockSaveWritingFeedback(999_999, validFeedback)).toThrow(
      "Lesson not found"
    );
    expect(mockCompleteRetryDrill(999_999, 1, "answer")).toBeNull();
    expect(mockCompleteRetryDrill(lesson.id, 999_999, "answer")).toBeNull();
  });

  it("keeps the default data readable without a browser", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: undefined
    });

    expect(mockGetLessons()).toHaveLength(2);
    expect(mockGetDashboardSummary().completedTopics).toBe(2);
    expect(mockGetReviewQueue(2).items).toHaveLength(2);
  });

  it("derives a learner-safe review queue from demo data", () => {
    mockGetLessons();
    const data = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]");
    data[0].roleplayTurns = [{
      id: 801,
      lessonPackId: 101,
      turnIndex: 1,
      aiPrompt: "Why move the meeting?",
      learnerGoal: "Explain the conflict.",
      learnerResponse: "I have a scheduling conflict."
    }];
    data[0].writingSubmission = {
      id: 802,
      lessonPackId: 101,
      task: "Write an email.",
      constraints: [],
      targetChunks: [],
      draft: "Could we reschedule?"
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(data));

    const queue = mockGetReviewQueue(2);
    const serialized = JSON.stringify(queue);

    expect(queue.items).toHaveLength(2);
    expect(queue.items[0]?.lessonId).toBe(101);
    expect(serialized).not.toContain("userId");
    expect(serialized).not.toContain("audioPath");
  });

  it("includes valid browser-only speaking transcripts and ignores malformed state", () => {
    storage.setItem("language_kit_demo_speaking_attempts", JSON.stringify([{
      lessonId: 101,
      promptType: "roleplay",
      transcript: "Could we reschedule?"
    }, {
      lessonId: 999,
      promptType: "roleplay",
      transcript: "Unknown lesson."
    }]));

    expect(mockGetReviewQueue(10).items).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceType: "speaking_attempt", lessonId: 101 })
    ]));

    storage.setItem("language_kit_demo_speaking_attempts", "{}");
    expect(mockGetReviewQueue(10).items.some(
      (item) => item.sourceType === "speaking_attempt"
    )).toBe(false);

    storage.setItem("language_kit_demo_speaking_attempts", "{broken-json");
    expect(mockGetReviewQueue(10).items.some(
      (item) => item.sourceType === "speaking_attempt"
    )).toBe(false);
  });
});
