"use client";

import {
  buildReviewQueue,
  type ReviewQueue
} from "@/src/lib/adaptive-review";
import { mockGetLessonDetail, mockGetLessons } from "@/src/lib/mockStore";

type DemoError = {
  id: number;
  lessonPackId: number;
  type: string;
  evidence: string;
  correction: string;
  retryPriority: string;
  createdAt: string;
};

type DemoSpeakingAttempt = {
  lessonId: number;
  promptType: string;
  promptRef?: string | null;
  transcript?: string | null;
  createdAt?: string;
};

export function mockGetReviewQueue(limit = 5): ReviewQueue {
  const lessons = mockGetLessons();
  const details = lessons
    .map((lesson) => mockGetLessonDetail(lesson.id))
    .filter((detail) => detail !== null);

  return buildReviewQueue({
    retryDrills: details.flatMap((detail) => {
      const errors = (detail.errorLogItems ?? []) as DemoError[];
      return detail.retryDrills.map((drill) => ({
        id: drill.id,
        lessonId: drill.lessonPackId,
        lessonTitle: detail.lesson.topic,
        instruction: drill.instruction,
        items: drill.items,
        errorLogId: errors[0]?.id ?? null,
        learnerResult: drill.learnerResult,
        completedAt: drill.completedAt ?? null,
        createdAt: detail.lessonPack.createdAt
      }));
    }),
    feedbackErrors: details.flatMap((detail) => (
      ((detail.errorLogItems ?? []) as DemoError[]).map((error) => ({
        id: error.id,
        lessonId: error.lessonPackId,
        lessonTitle: detail.lesson.topic,
        errorType: error.type,
        evidence: error.evidence,
        correction: error.correction,
        retryPriority: error.retryPriority,
        resolvedAt: null,
        createdAt: error.createdAt
      }))
    )),
    listeningAttempts: details.flatMap((detail) => (
      detail.listeningAttempts.map((attempt) => ({
        id: attempt.id,
        lessonId: attempt.lessonPackId,
        lessonTitle: detail.lesson.topic,
        scoreGist: attempt.scoreGist,
        scoreDetail: attempt.scoreDetail,
        scoreKeyPhrase: attempt.scoreKeyPhrase,
        missedDetails: attempt.missedDetails,
        createdAt: attempt.createdAt
      }))
    )),
    roleplayTurns: details.flatMap((detail) => (
      (detail.roleplayTurns ?? []).map((turn) => ({
        id: turn.id,
        lessonId: turn.lessonPackId,
        lessonTitle: detail.lesson.topic,
        turnIndex: turn.turnIndex,
        learnerGoal: turn.learnerGoal,
        learnerResponse: turn.learnerResponse ?? null,
        feedbackJson: null,
        createdAt: detail.lessonPack.createdAt
      }))
    )),
    writingSubmissions: details.flatMap((detail) => (
      detail.writingSubmission ? [{
        id: detail.writingSubmission.id,
        lessonId: detail.writingSubmission.lessonPackId,
        lessonTitle: detail.lesson.topic,
        task: detail.writingSubmission.task,
        draft: detail.writingSubmission.draft ?? null,
        correctedVersion: null,
        feedbackJson: null,
        createdAt: detail.lessonPack.createdAt
      }] : []
    )),
    speakingAttempts: readDemoSpeakingAttempts(lessons)
  }, { limit });
}

function readDemoSpeakingAttempts(lessons: ReturnType<typeof mockGetLessons>) {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem("language_kit_demo_speaking_attempts") ?? "[]"
    );
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((attempt: DemoSpeakingAttempt, index) => {
      const lesson = lessons.find((item) => item.id === attempt.lessonId);
      if (!lesson) return [];
      return [{
        id: index + 1,
        lessonId: attempt.lessonId,
        lessonTitle: lesson.topic,
        promptType: attempt.promptType,
        promptRef: attempt.promptRef ?? null,
        transcript: attempt.transcript ?? null,
        createdAt: attempt.createdAt ?? lesson.createdAt
      }];
    });
  } catch {
    return [];
  }
}
