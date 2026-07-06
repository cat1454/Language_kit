import type { FeedbackV1 } from "@/src/lib/contracts";

export const REVIEW_EVIDENCE_SNIPPET_MAX_LENGTH = 180;

export type ReviewSourceType =
  | "retry_drill"
  | "feedback_error"
  | "listening_check"
  | "writing_submission"
  | "roleplay_turn"
  | "speaking_attempt";

export type ReviewActionType =
  | "retry_drill"
  | "review_error"
  | "redo_listening"
  | "revise_writing"
  | "practice_roleplay"
  | "practice_speaking";

export type ReviewPriority = 1 | 2 | 3 | 4;

export type ReviewItem = {
  id: string;
  sourceType: ReviewSourceType;
  lessonId: number;
  lessonTitle: string;
  title: string;
  reason: string;
  priority: ReviewPriority;
  actionType: ReviewActionType;
  sourceUpdatedAt?: string;
  evidenceSnippet?: string;
  completed?: boolean;
};

export type ReviewQueueSummary = {
  total: number;
  urgent: number;
  high: number;
  normal: number;
  low: number;
};

export type ReviewQueue = {
  items: ReviewItem[];
  summary: ReviewQueueSummary;
};

type TimestampValue = string | Date | null | undefined;

type BaseSignal = {
  id: number;
  lessonId: number;
  lessonTitle?: string | null;
  sourceUpdatedAt?: TimestampValue;
  createdAt?: TimestampValue;
};

export type RetryDrillReviewSignal = BaseSignal & {
  instruction: string;
  items: string[];
  errorLogId?: number | null;
  learnerResult?: string | null;
  completedAt?: TimestampValue;
};

export type FeedbackErrorReviewSignal = BaseSignal & {
  errorType: string;
  evidence: string;
  correction: string;
  retryPriority: string;
  resolvedAt?: TimestampValue;
};

export type ListeningAttemptReviewSignal = BaseSignal & {
  scoreGist: number;
  scoreDetail: number;
  scoreKeyPhrase: number;
  missedDetails: string[];
};

export type WritingSubmissionReviewSignal = BaseSignal & {
  task: string;
  draft?: string | null;
  correctedVersion?: string | null;
  feedbackJson?: FeedbackV1 | null;
};

export type RoleplayTurnReviewSignal = BaseSignal & {
  turnIndex: number;
  learnerGoal: string;
  learnerResponse?: string | null;
  feedbackJson?: FeedbackV1 | null;
};

export type SpeakingAttemptReviewSignal = BaseSignal & {
  promptType: string;
  promptRef?: string | null;
  transcript?: string | null;
};

export type ReviewSignalInput = {
  retryDrills?: readonly RetryDrillReviewSignal[];
  feedbackErrors?: readonly FeedbackErrorReviewSignal[];
  listeningAttempts?: readonly ListeningAttemptReviewSignal[];
  writingSubmissions?: readonly WritingSubmissionReviewSignal[];
  roleplayTurns?: readonly RoleplayTurnReviewSignal[];
  speakingAttempts?: readonly SpeakingAttemptReviewSignal[];
};

export function buildReviewQueue(
  input: ReviewSignalInput,
  options: { limit?: number } = {}
): ReviewQueue {
  const sorted = [
    ...(input.retryDrills ?? []).map(mapRetryDrill),
    ...(input.feedbackErrors ?? []).map(mapFeedbackError),
    ...(input.listeningAttempts ?? []).map(mapListeningAttempt),
    ...(input.writingSubmissions ?? []).map(mapWritingSubmission),
    ...(input.roleplayTurns ?? []).map(mapRoleplayTurn),
    ...(input.speakingAttempts ?? []).map(mapSpeakingAttempt)
  ].filter((item): item is ReviewItem => Boolean(item)).sort(compareReviewItems);

  return {
    items: sorted.slice(0, options.limit ?? sorted.length),
    summary: summarizeReviewItems(sorted)
  };
}

export function summarizeReviewItems(items: ReviewItem[]): ReviewQueueSummary {
  return items.reduce<ReviewQueueSummary>(
    (summary, item) => {
      summary.total += 1;
      if (item.priority === 4) summary.urgent += 1;
      if (item.priority === 3) summary.high += 1;
      if (item.priority === 2) summary.normal += 1;
      if (item.priority === 1) summary.low += 1;
      return summary;
    },
    { total: 0, urgent: 0, high: 0, normal: 0, low: 0 }
  );
}

function mapRetryDrill(signal: RetryDrillReviewSignal): ReviewItem | null {
  if (!hasText(signal.instruction)) return null;
  const completed = Boolean(signal.completedAt || hasText(signal.learnerResult));
  const fromFeedback = signal.errorLogId !== null && signal.errorLogId !== undefined;
  return item(signal, {
    sourceType: "retry_drill",
    title: `Retry: ${signal.instruction}`,
    reason: completed
      ? "This retry drill is already completed."
      : fromFeedback
        ? "Feedback created an unfinished retry drill."
        : "This lesson has an unfinished retry drill.",
    priority: completed ? 1 : fromFeedback ? 4 : 2,
    actionType: "retry_drill",
    evidenceSnippet: signal.items[0] ?? signal.learnerResult ?? signal.instruction,
    completed
  });
}

function mapFeedbackError(signal: FeedbackErrorReviewSignal): ReviewItem | null {
  if (!hasText(signal.evidence) || !hasText(signal.correction)) return null;
  const completed = Boolean(signal.resolvedAt);
  const urgent = signal.retryPriority.toLowerCase() === "high";
  return item(signal, {
    sourceType: "feedback_error",
    title: `Review ${signal.errorType} correction`,
    reason: completed
      ? "This feedback error is already marked resolved."
      : "Feedback logged a correction to retry.",
    priority: completed ? 1 : urgent ? 4 : 3,
    actionType: "review_error",
    evidenceSnippet: `${signal.evidence} -> ${signal.correction}`,
    completed
  });
}

function mapListeningAttempt(signal: ListeningAttemptReviewSignal): ReviewItem | null {
  const average = (signal.scoreGist + signal.scoreDetail + signal.scoreKeyPhrase) / 3;
  if (average >= 0.8 && signal.missedDetails.length === 0) return null;
  return item(signal, {
    sourceType: "listening_check",
    title: "Redo listening check",
    reason: "A listening check has weak or missed details.",
    priority: 3,
    actionType: "redo_listening",
    evidenceSnippet: signal.missedDetails.length > 0
      ? `Missed: ${signal.missedDetails.join(", ")}`
      : `Listening score: ${Math.round(average * 100)}%`
  });
}

function mapWritingSubmission(signal: WritingSubmissionReviewSignal): ReviewItem | null {
  const hasDraft = hasText(signal.draft);
  const hasFeedbackErrors = (signal.feedbackJson?.error_log_items.length ?? 0) > 0;
  if (!hasDraft && !hasFeedbackErrors) return null;
  const unresolvedFeedback = hasFeedbackErrors && !hasText(signal.correctedVersion);
  return item(signal, {
    sourceType: "writing_submission",
    title: unresolvedFeedback ? "Revise writing feedback" : "Review writing draft",
    reason: unresolvedFeedback
      ? "Accepted feedback has unresolved writing corrections."
      : "A writing draft is waiting for feedback or revision.",
    priority: unresolvedFeedback ? 3 : 2,
    actionType: "revise_writing",
    evidenceSnippet: unresolvedFeedback
      ? signal.feedbackJson?.error_log_items[0]?.evidence
      : signal.draft ?? undefined
  });
}

function mapRoleplayTurn(signal: RoleplayTurnReviewSignal): ReviewItem | null {
  if (!hasText(signal.learnerResponse) || signal.feedbackJson) return null;
  return item(signal, {
    sourceType: "roleplay_turn",
    title: `Practice roleplay turn ${signal.turnIndex}`,
    reason: "A roleplay response has no follow-up feedback yet.",
    priority: 2,
    actionType: "practice_roleplay",
    evidenceSnippet: signal.learnerResponse
  });
}

function mapSpeakingAttempt(signal: SpeakingAttemptReviewSignal): ReviewItem | null {
  if (!hasText(signal.transcript)) return null;
  return item(signal, {
    sourceType: "speaking_attempt",
    title: "Practice speaking follow-up",
    reason: "A manual speaking transcript is ready to review.",
    priority: 2,
    actionType: "practice_speaking",
    evidenceSnippet: signal.transcript
  });
}

function item(
  signal: BaseSignal,
  values: Omit<ReviewItem, "id" | "lessonId" | "lessonTitle" | "sourceUpdatedAt">
): ReviewItem {
  return {
    id: `${values.sourceType}:${signal.id}`,
    lessonId: signal.lessonId,
    lessonTitle: safeLessonTitle(signal),
    sourceUpdatedAt: toIso(signal.sourceUpdatedAt ?? signal.createdAt),
    ...values,
    title: capText(values.title, 80),
    evidenceSnippet: capSnippet(values.evidenceSnippet)
  };
}

function compareReviewItems(a: ReviewItem, b: ReviewItem): number {
  if (a.priority !== b.priority) return b.priority - a.priority;
  const dateDifference = timestamp(b.sourceUpdatedAt) - timestamp(a.sourceUpdatedAt);
  if (dateDifference !== 0) return dateDifference;
  return a.id.localeCompare(b.id);
}

function safeLessonTitle(signal: BaseSignal): string {
  return hasText(signal.lessonTitle) ? capText(signal.lessonTitle, 80) : `Lesson ${signal.lessonId}`;
}

function capSnippet(value: string | null | undefined): string | undefined {
  if (!hasText(value)) return undefined;
  return capText(value, REVIEW_EVIDENCE_SNIPPET_MAX_LENGTH);
}

function capText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function toIso(value: TimestampValue): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function timestamp(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
