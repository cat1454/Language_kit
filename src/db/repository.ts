import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/src/db/client";
import {
  chunks,
  errorLog,
  lessonPacks,
  listeningInputs,
  modelOutputs,
  retryDrills,
  roleplayTurns,
  topics,
  writingSubmissions
} from "@/src/db/schema";
import {
  buildFeedbackScoringExportRows,
  buildJsonRepairExportRows,
  buildLessonGenerationExportRows,
  buildRetryGenerationExportRows,
  type DatasetExportKind
} from "@/src/lib/exports";
import type {
  LessonPackStatus,
  LessonPackV1,
  RejectionReason,
  SourceMode
} from "@/src/lib/contracts";

export {
  completeRetryDrill,
  saveFeedback,
  saveListeningAttempt,
  saveRejectedFeedbackOutput,
  saveRoleplayTurnResponse,
  saveSpeakingAttempt,
  saveWritingDraft
} from "@/src/db/practice-repository";
export { getLessonPackDetail } from "@/src/db/lesson-detail-repository";
export { getReviewQueue } from "@/src/db/review-repository";

export type LessonPackSubmission = {
  prompt: string;
  rawAiOutput: string;
  parsedJson: unknown | null;
  validatedJson: LessonPackV1 | null;
  sourceMode: SourceMode;
  providerOrSite?: string | null;
  modelName?: string | null;
  status: LessonPackStatus;
  rejectionReason: RejectionReason | null;
  sessionMinutes?: number;
};

export async function saveLessonPackSubmission(input: LessonPackSubmission) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [modelOutput] = await tx
      .insert(modelOutputs)
      .values({
        taskType: "lesson_generation",
        sourceMode: input.sourceMode,
        providerOrSite: input.providerOrSite ?? null,
        modelName: input.modelName ?? null,
        prompt: input.prompt,
        rawResponse: input.rawAiOutput,
        parsedJson: input.parsedJson,
        accepted: input.status === "accepted",
        rejectionReason: input.rejectionReason
      })
      .returning();

    if (!input.validatedJson) {
      return {
        id: null,
        modelOutputId: modelOutput.id,
        status: input.status,
        rejectionReason: input.rejectionReason
      };
    }

    const lesson = input.validatedJson;
    const [topic] = await tx
      .insert(topics)
      .values({
        topic: lesson.topic,
        targetLanguage: lesson.target_language,
        learnerNativeLanguage: lesson.learner_native_language,
        cefrLevel: lesson.cefr_level,
        situation: lesson.situation,
        sessionMinutes: input.sessionMinutes ?? 30
      })
      .returning();

    const [lessonPack] = await tx
      .insert(lessonPacks)
      .values({
        topicId: topic.id,
        schemaVersion: lesson.schema_version,
        prompt: input.prompt,
        rawAiOutput: input.rawAiOutput,
        validatedJson: lesson,
        sourceMode: input.sourceMode,
        providerOrSite: input.providerOrSite ?? null,
        modelName: input.modelName ?? null,
        status: input.status,
        rejectionReason: input.rejectionReason,
        acceptedAt: new Date()
      })
      .returning();

    const [listeningInput] = await tx
      .insert(listeningInputs)
      .values({
        lessonPackId: lessonPack.id,
        script: lesson.listening_input.script,
        recommendedVoice: lesson.listening_input.recommended_voice,
        accent: lesson.listening_input.accent,
        speed: lesson.listening_input.speed,
        durationSeconds: lesson.listening_input.duration_seconds,
        transcriptVisibleAfterAttempt: true
      })
      .returning();

    await tx.insert(chunks).values(
      lesson.post_listening.chunks.map((chunk) => ({
        lessonPackId: lessonPack.id,
        phrase: chunk.phrase,
        meaning: chunk.meaning,
        example: chunk.example,
        sourceContext: lesson.situation
      }))
    );

    await tx.insert(roleplayTurns).values(
      lesson.roleplay.turns.map((turn, index) => ({
        lessonPackId: lessonPack.id,
        turnIndex: index + 1,
        aiPrompt: turn.ai_prompt,
        learnerGoal: turn.learner_goal
      }))
    );

    await tx.insert(writingSubmissions).values({
      lessonPackId: lessonPack.id,
      task: lesson.writing_task.task,
      constraintsJson: lesson.writing_task.constraints,
      targetChunksJson: lesson.writing_task.target_chunks_to_use
    });

    await tx.insert(retryDrills).values(
      lesson.retry_drills.map((drill) => ({
        lessonPackId: lessonPack.id,
        instruction: drill.instruction,
        itemsJson: drill.items
      }))
    );

    return {
      id: lessonPack.id,
      modelOutputId: modelOutput.id,
      listeningInputId: listeningInput.id,
      status: input.status,
      rejectionReason: input.rejectionReason,
      topic: lesson.topic
    };
  });
}

export async function listLessonPacks() {
  const db = getDb();

  return db
    .select({
      id: lessonPacks.id,
      status: lessonPacks.status,
      topic: topics.topic,
      cefrLevel: topics.cefrLevel,
      situation: topics.situation,
      createdAt: lessonPacks.createdAt
    })
    .from(lessonPacks)
    .leftJoin(topics, eq(lessonPacks.topicId, topics.id))
    .orderBy(desc(lessonPacks.createdAt));
}

export async function getDashboardSummary() {
  const db = getDb();
  const acceptedLessons = await db
    .select()
    .from(lessonPacks)
    .where(eq(lessonPacks.status, "accepted"));

  const unresolvedErrors = await db
    .select()
    .from(errorLog)
    .where(eq(errorLog.sourceType, "feedback"));

  const completedDrills = await db
    .select()
    .from(retryDrills)
    .where(isNotNull(retryDrills.completedAt));

  return {
    completedTopics: acceptedLessons.length,
    repeatedErrorTypes: summarizeBy(unresolvedErrors.map((error) => error.errorType)),
    completedRetryDrills: completedDrills.length
  };
}

export async function getDatasetExportRows(kind: DatasetExportKind) {
  const db = getDb();

  if (kind === "lesson_generation_sft") {
    const rows = await db
      .select()
      .from(lessonPacks)
      .where(
        and(
          eq(lessonPacks.status, "accepted"),
          isNotNull(lessonPacks.validatedJson)
        )
      )
      .orderBy(desc(lessonPacks.createdAt));

    return buildLessonGenerationExportRows(
      rows
        .filter((row) => row.validatedJson)
        .map((row) => ({
          id: row.id,
          prompt: row.prompt,
          rawAiOutput: row.rawAiOutput,
          validatedJson: row.validatedJson as LessonPackV1,
          sourceMode: row.sourceMode,
          rejectionReason: row.rejectionReason,
          createdAt: row.createdAt
        }))
    );
  }

  if (kind === "feedback_scoring_sft") {
    const rows = await db
      .select()
      .from(modelOutputs)
      .where(eq(modelOutputs.taskType, "feedback_scoring"))
      .orderBy(desc(modelOutputs.createdAt));

    return buildFeedbackScoringExportRows(rows);
  }

  if (kind === "error_classification") {
    const rows = await db.select().from(errorLog).orderBy(desc(errorLog.createdAt));
    return rows.map((row) => ({
      evidence: row.evidence,
      error_type: row.errorType,
      correction: row.correction,
      why_it_matters: row.whyItMatters,
      retry_priority: row.retryPriority
    }));
  }

  if (kind === "retry_generation_sft") {
    const rows = await db
      .select({
        instruction: retryDrills.instruction,
        items: retryDrills.itemsJson,
        evidence: errorLog.evidence,
        correction: errorLog.correction
      })
      .from(retryDrills)
      .leftJoin(errorLog, eq(retryDrills.errorLogId, errorLog.id))
      .orderBy(desc(retryDrills.createdAt));

    return buildRetryGenerationExportRows(rows);
  }

  const rows = await db
    .select()
    .from(modelOutputs)
    .where(
      and(
        eq(modelOutputs.accepted, false),
        isNotNull(modelOutputs.rejectionReason)
      )
    )
    .orderBy(desc(modelOutputs.createdAt));

  return buildJsonRepairExportRows(rows);
}

function summarizeBy(values: string[]) {
  return values.reduce<Record<string, number>>((summary, value) => {
    summary[value] = (summary[value] ?? 0) + 1;
    return summary;
  }, {});
}
