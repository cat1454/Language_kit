import { and, eq } from "drizzle-orm";
import { getDb } from "@/src/db/client";
import {
  errorLog,
  lessonPacks,
  listeningAttempts,
  listeningInputs,
  modelOutputs,
  retryDrills,
  roleplayTurns,
  speakingAttempts,
  writingSubmissions
} from "@/src/db/schema";
import type { FeedbackV1, RejectionReason, SourceMode } from "@/src/lib/contracts";
import { buildWritingFeedbackPatch } from "@/src/lib/feedback-persistence";
import type {
  SpeakingSttProvider,
  SpeakingSttStatus
} from "@/src/lib/speaking-transcription";

export async function saveListeningAttempt(input: {
  lessonPackId: number;
  gistAnswers: string[];
  detailAnswers: string[];
  keyPhraseAnswers: string[];
  replayCount: number;
  scoreGist: number;
  scoreDetail: number;
  scoreKeyPhrase: number;
  missedDetails: string[];
}) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [listeningInput] = await tx
      .select({ id: listeningInputs.id })
      .from(listeningInputs)
      .where(eq(listeningInputs.lessonPackId, input.lessonPackId))
      .limit(1);

    if (!listeningInput) return null;

    const [attempt] = await tx
      .insert(listeningAttempts)
      .values({ ...input, listeningInputId: listeningInput.id })
      .returning();
    return attempt;
  });
}

export async function saveSpeakingAttempt(input: {
  lessonPackId: number;
  promptType: string;
  promptRef: string | null;
  transcript: string | null;
  sttProvider: SpeakingSttProvider | null;
  sttStatus: SpeakingSttStatus;
}) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [lesson] = await tx
      .select({ id: lessonPacks.id })
      .from(lessonPacks)
      .where(eq(lessonPacks.id, input.lessonPackId))
      .limit(1);

    if (!lesson) return null;

    const [attempt] = await tx
      .insert(speakingAttempts)
      .values(input)
      .returning();
    return attempt;
  });
}

export async function saveRoleplayTurnResponse(input: {
  lessonId: number;
  turnId: number;
  learnerResponse: string;
}) {
  const db = getDb();
  const [turn] = await db
    .update(roleplayTurns)
    .set({ learnerResponse: input.learnerResponse })
    .where(
      and(
        eq(roleplayTurns.id, input.turnId),
        eq(roleplayTurns.lessonPackId, input.lessonId)
      )
    )
    .returning();
  return turn ?? null;
}

export async function saveWritingDraft(input: {
  lessonId: number;
  writingSubmissionId: number;
  draft: string;
}) {
  const db = getDb();
  const [submission] = await db
    .update(writingSubmissions)
    .set({ draft: input.draft })
    .where(
      and(
        eq(writingSubmissions.id, input.writingSubmissionId),
        eq(writingSubmissions.lessonPackId, input.lessonId)
      )
    )
    .returning();
  return submission ?? null;
}

export async function saveFeedback(input: {
  lessonPackId: number;
  prompt: string;
  rawAiOutput: string;
  feedback: FeedbackV1;
  sourceMode: SourceMode;
  providerOrSite?: string | null;
  modelName?: string | null;
}) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [lesson] = await tx
      .select({ id: lessonPacks.id })
      .from(lessonPacks)
      .where(eq(lessonPacks.id, input.lessonPackId))
      .limit(1);

    if (!lesson) return null;

    const [output] = await tx
      .insert(modelOutputs)
      .values({
        taskType: "feedback_scoring",
        sourceMode: input.sourceMode,
        providerOrSite: input.providerOrSite ?? null,
        modelName: input.modelName ?? null,
        prompt: input.prompt,
        rawResponse: input.rawAiOutput,
        parsedJson: input.feedback,
        accepted: true,
        rejectionReason: null
      })
      .returning();

    const insertedErrors = await tx
      .insert(errorLog)
      .values(input.feedback.error_log_items.map((item) => ({
        lessonPackId: input.lessonPackId,
        sourceType: "feedback" as const,
        errorType: item.type,
        evidence: item.evidence,
        correction: item.correction,
        whyItMatters: item.why_it_matters,
        retryPriority: item.retry_priority
      })))
      .returning();

    const [retryDrill] = await tx
      .insert(retryDrills)
      .values({
        lessonPackId: input.lessonPackId,
        errorLogId: insertedErrors[0]?.id ?? null,
        instruction: input.feedback.retry_drill.instruction,
        itemsJson: input.feedback.retry_drill.items
      })
      .returning();

    await tx
      .update(writingSubmissions)
      .set(buildWritingFeedbackPatch(input.feedback))
      .where(eq(writingSubmissions.lessonPackId, input.lessonPackId));

    return {
      modelOutputId: output.id,
      errorCount: insertedErrors.length,
      retryDrillId: retryDrill.id
    };
  });
}

export async function saveRejectedFeedbackOutput(input: {
  lessonPackId: number;
  prompt: string;
  rawAiOutput: string;
  parsedJson: unknown | null;
  rejectionReason: RejectionReason;
  sourceMode: SourceMode;
  providerOrSite?: string | null;
  modelName?: string | null;
}) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [lesson] = await tx
      .select({ id: lessonPacks.id })
      .from(lessonPacks)
      .where(eq(lessonPacks.id, input.lessonPackId))
      .limit(1);

    if (!lesson) return null;

    const [output] = await tx
      .insert(modelOutputs)
      .values({
        taskType: "feedback_scoring",
        sourceMode: input.sourceMode,
        providerOrSite: input.providerOrSite ?? null,
        modelName: input.modelName ?? null,
        prompt: input.prompt,
        rawResponse: input.rawAiOutput,
        parsedJson: input.parsedJson,
        accepted: false,
        rejectionReason: input.rejectionReason
      })
      .returning();

    return { modelOutputId: output.id };
  });
}

export async function completeRetryDrill(id: number, learnerResult: string) {
  const db = getDb();
  const [drill] = await db
    .update(retryDrills)
    .set({ learnerResult, completedAt: new Date() })
    .where(eq(retryDrills.id, id))
    .returning();
  return drill;
}
