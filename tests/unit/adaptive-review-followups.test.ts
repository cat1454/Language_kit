import { describe, expect, it } from "vitest";
import { validFeedback } from "@/src/demo/lesson-pack-fixture";
import { buildReviewQueue } from "@/src/lib/adaptive-review";

describe("adaptive review follow-up mappings", () => {
  it("maps writing, roleplay, and score-only listening follow-ups", () => {
    const queue = buildReviewQueue({
      listeningAttempts: [{
        id: 20,
        lessonId: 42,
        lessonTitle: null,
        scoreGist: 0.7,
        scoreDetail: 0.7,
        scoreKeyPhrase: 0.7,
        missedDetails: [],
        createdAt: "invalid-date"
      }],
      writingSubmissions: [
        {
          id: 21,
          lessonId: 42,
          lessonTitle: "Reschedule a meeting",
          task: "Write an email.",
          draft: "Could we reschedule?",
          feedbackJson: null,
          correctedVersion: null,
          createdAt: "2026-07-06T12:00:00.000Z"
        },
        {
          id: 22,
          lessonId: 42,
          lessonTitle: "Reschedule a meeting",
          task: "Write an email.",
          draft: "I want change meeting.",
          feedbackJson: validFeedback,
          correctedVersion: null,
          createdAt: "2026-07-06T13:00:00.000Z"
        }
      ],
      roleplayTurns: [
        {
          id: 23,
          lessonId: 42,
          lessonTitle: "Reschedule a meeting",
          turnIndex: 1,
          learnerGoal: "Explain the conflict.",
          learnerResponse: "I have a scheduling conflict.",
          feedbackJson: null,
          createdAt: "2026-07-06T11:00:00.000Z"
        },
        {
          id: 24,
          lessonId: 42,
          lessonTitle: "Reschedule a meeting",
          turnIndex: 2,
          learnerGoal: "Suggest a time.",
          learnerResponse: "Would Friday work?",
          feedbackJson: validFeedback,
          createdAt: "2026-07-06T11:00:00.000Z"
        }
      ]
    });

    expect(queue.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "writing_submission:22",
        priority: 3,
        title: "Revise writing feedback"
      }),
      expect.objectContaining({
        id: "writing_submission:21",
        priority: 2,
        title: "Review writing draft"
      }),
      expect.objectContaining({
        id: "roleplay_turn:23",
        actionType: "practice_roleplay"
      }),
      expect.objectContaining({
        id: "listening_check:20",
        lessonTitle: "Lesson 42",
        evidenceSnippet: "Listening score: 70%"
      })
    ]));
    expect(queue.items.some((item) => item.id === "roleplay_turn:24")).toBe(false);
  });
});
