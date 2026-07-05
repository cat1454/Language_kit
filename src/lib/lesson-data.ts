import type { FeedbackV1, LessonPackV1 } from "@/src/lib/contracts";

export type DataSource = "api" | "demo";

export type LessonListItem = {
  id: number;
  status: string;
  topic: string;
  cefrLevel: string;
  situation: string;
  createdAt: string;
};

export type ListeningAttempt = {
  id: number;
  lessonPackId: number;
  gistAnswers: string[];
  detailAnswers: string[];
  keyPhraseAnswers: string[];
  replayCount: number;
  scoreGist: number;
  scoreDetail: number;
  scoreKeyPhrase: number;
  missedDetails: string[];
  createdAt: string;
};

export type RetryDrill = {
  id: number;
  lessonPackId: number;
  instruction: string;
  items: string[];
  learnerResult?: string | null;
  completedAt?: string | null;
};

export type LessonDetail = {
  lessonPack: {
    id: number;
    status: string;
    prompt: string;
    rawAiOutput: string;
    validatedJson: LessonPackV1;
    createdAt: string;
  };
  lesson: LessonPackV1;
  listeningInputId?: number;
  listeningAttempts: ListeningAttempt[];
  retryDrills: RetryDrill[];
};

export type DashboardSummary = {
  completedTopics: number;
  completedRetryDrills: number;
  repeatedErrorTypes: Record<string, number>;
};

export type FeedbackResponse = {
  status: "accepted";
  feedback: FeedbackV1;
  modelOutputId: number;
  errorCount: number;
  retryDrillId: number;
};

const SOURCE_KEY = "language_kit_data_source";

export function getSessionDataSource(): DataSource | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(SOURCE_KEY);
  return value === "api" || value === "demo" ? value : null;
}

export function setSessionDataSource(source: DataSource): void {
  window.sessionStorage.setItem(SOURCE_KEY, source);
}

export function clearSessionDataSource(): void {
  window.sessionStorage.removeItem(SOURCE_KEY);
}
