import { describe, expect, it } from "vitest";
import {
  REVIEW_EVIDENCE_SNIPPET_MAX_LENGTH,
  buildReviewQueue
} from "@/src/lib/adaptive-review";

describe("adaptive review queue", () => {
  it("ranks open feedback retry drills above weaker signals", () => {
    const queue = buildReviewQueue({
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
        promptRef: "Ask to move the meeting.",
        transcript: "Could we reschedule?",
        createdAt: "2026-07-06T13:00:00.000Z"
      }]
    });

    expect(queue.items[0]).toMatchObject({
      id: "retry_drill:7",
      sourceType: "retry_drill",
      priority: 4,
      actionType: "retry_drill",
      completed: false
    });
    expect(queue.items[1]).toMatchObject({
      id: "speaking_attempt:9",
      priority: 2
    });
  });

  it("keeps stable review item IDs across runs", () => {
    const input = {
      feedbackErrors: [{
        id: 11,
        lessonId: 42,
        lessonTitle: "Reschedule a meeting",
        errorType: "naturalness",
        evidence: "I want change meeting.",
        correction: "I would like to reschedule the meeting.",
        retryPriority: "high",
        resolvedAt: null,
        createdAt: "2026-07-06T12:00:00.000Z"
      }]
    } as const;

    expect(buildReviewQueue(input).items.map((item) => item.id)).toEqual(
      buildReviewQueue(input).items.map((item) => item.id)
    );
    expect(buildReviewQueue(input).items[0]?.id).toBe("feedback_error:11");
  });

  it("caps evidence snippets to a safe length", () => {
    const longEvidence = "x".repeat(REVIEW_EVIDENCE_SNIPPET_MAX_LENGTH + 80);
    const queue = buildReviewQueue({
      feedbackErrors: [{
        id: 12,
        lessonId: 42,
        lessonTitle: "Reschedule a meeting",
        errorType: "grammar",
        evidence: longEvidence,
        correction: "Use a complete sentence.",
        retryPriority: "high",
        resolvedAt: null,
        createdAt: "2026-07-06T12:00:00.000Z"
      }]
    });

    expect(queue.items[0]?.evidenceSnippet).toHaveLength(
      REVIEW_EVIDENCE_SNIPPET_MAX_LENGTH
    );
    expect(queue.items[0]?.evidenceSnippet).not.toContain(longEvidence);
  });

  it("sorts deterministically by priority, date, then id", () => {
    const queue = buildReviewQueue({
      retryDrills: [
        {
          id: 20,
          lessonId: 42,
          lessonTitle: "Reschedule a meeting",
          instruction: "Older normal drill.",
          items: ["older"],
          errorLogId: null,
          completedAt: null,
          createdAt: "2026-07-05T12:00:00.000Z"
        },
        {
          id: 10,
          lessonId: 42,
          lessonTitle: "Reschedule a meeting",
          instruction: "Newer normal drill.",
          items: ["newer"],
          errorLogId: null,
          completedAt: null,
          createdAt: "2026-07-06T12:00:00.000Z"
        },
        {
          id: 12,
          lessonId: 42,
          lessonTitle: "Reschedule a meeting",
          instruction: "Same time normal drill.",
          items: ["same"],
          errorLogId: null,
          completedAt: null,
          createdAt: "2026-07-06T12:00:00.000Z"
        }
      ],
      listeningAttempts: [{
        id: 3,
        lessonId: 42,
        lessonTitle: "Reschedule a meeting",
        scoreGist: 0.4,
        scoreDetail: 0.5,
        scoreKeyPhrase: 0.5,
        missedDetails: ["Friday at 3"],
        createdAt: "2026-07-04T12:00:00.000Z"
      }]
    });

    expect(queue.items.map((item) => item.id)).toEqual([
      "listening_check:3",
      "retry_drill:10",
      "retry_drill:12",
      "retry_drill:20"
    ]);
  });

  it("omits empty or unsupported weak signals safely", () => {
    const queue = buildReviewQueue({
      speakingAttempts: [{
        id: 1,
        lessonId: 42,
        lessonTitle: "Reschedule a meeting",
        promptType: "roleplay",
        promptRef: null,
        transcript: "   ",
        createdAt: "2026-07-06T12:00:00.000Z"
      }],
      roleplayTurns: [{
        id: 2,
        lessonId: 42,
        lessonTitle: "Reschedule a meeting",
        turnIndex: 1,
        learnerGoal: "Explain the conflict.",
        learnerResponse: null,
        feedbackJson: null,
        createdAt: "2026-07-06T12:00:00.000Z"
      }],
      writingSubmissions: [{
        id: 3,
        lessonId: 42,
        lessonTitle: "Reschedule a meeting",
        task: "Write an email.",
        draft: null,
        feedbackJson: null,
        correctedVersion: null,
        createdAt: "2026-07-06T12:00:00.000Z"
      }],
      listeningAttempts: [{
        id: 4,
        lessonId: 42,
        lessonTitle: "Reschedule a meeting",
        scoreGist: 1,
        scoreDetail: 1,
        scoreKeyPhrase: 1,
        missedDetails: [],
        createdAt: "2026-07-06T12:00:00.000Z"
      }]
    });

    expect(queue.items).toEqual([]);
    expect(queue.summary.total).toBe(0);
  });

  it("summarizes priority buckets before applying the display limit", () => {
    const queue = buildReviewQueue({
      retryDrills: [
        {
          id: 1,
          lessonId: 42,
          lessonTitle: "Reschedule a meeting",
          instruction: "Urgent feedback drill.",
          items: ["one"],
          errorLogId: 1,
          completedAt: null,
          createdAt: "2026-07-06T12:00:00.000Z"
        },
        {
          id: 2,
          lessonId: 42,
          lessonTitle: "Reschedule a meeting",
          instruction: "Completed drill.",
          items: ["two"],
          errorLogId: null,
          completedAt: "2026-07-06T12:00:00.000Z",
          createdAt: "2026-07-05T12:00:00.000Z"
        }
      ],
      listeningAttempts: [{
        id: 3,
        lessonId: 42,
        lessonTitle: "Reschedule a meeting",
        scoreGist: 0.5,
        scoreDetail: 0.5,
        scoreKeyPhrase: 0.5,
        missedDetails: ["Friday at 3"],
        createdAt: "2026-07-06T11:00:00.000Z"
      }],
      speakingAttempts: [{
        id: 4,
        lessonId: 42,
        lessonTitle: "Reschedule a meeting",
        promptType: "roleplay",
        promptRef: "Explain the conflict.",
        transcript: "Could we reschedule?",
        createdAt: "2026-07-06T10:00:00.000Z"
      }]
    }, { limit: 2 });

    expect(queue.items).toHaveLength(2);
    expect(queue.summary).toEqual({
      total: 4,
      urgent: 1,
      high: 1,
      normal: 1,
      low: 1
    });
  });

  it("does not project audio paths or user placeholders", () => {
    const queue = buildReviewQueue({
      speakingAttempts: [{
        id: 5,
        lessonId: 42,
        lessonTitle: "Reschedule a meeting",
        promptType: "roleplay",
        promptRef: "Explain the conflict.",
        transcript: "Could we reschedule?",
        createdAt: "2026-07-06T12:00:00.000Z",
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

    const serialized = JSON.stringify(queue.items);
    expect(serialized).not.toContain("userId");
    expect(serialized).not.toContain("audioPath");
    expect(serialized).not.toContain("raw-audio");
  });
});
