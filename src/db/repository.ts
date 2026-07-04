import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/src/db/client";
import {
  chunks,
  errorLog,
  lessonPacks,
  listeningAttempts,
  listeningInputs,
  modelOutputs,
  retryDrills,
  roleplayTurns,
  topics,
  writingSubmissions
} from "@/src/db/schema";
import {
  buildLessonGenerationExportRows,
  type DatasetExportKind
} from "@/src/lib/exports";
import type {
  FeedbackV1,
  LessonPackStatus,
  LessonPackV1,
  RejectionReason,
  SourceMode
} from "@/src/lib/contracts";

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

export async function getLessonPackDetail(id: number) {
  const db = getDb();
  const [lesson] = await db
    .select()
    .from(lessonPacks)
    .where(eq(lessonPacks.id, id))
    .limit(1);

  if (!lesson?.validatedJson) {
    return null;
  }

  const [input] = await db
    .select()
    .from(listeningInputs)
    .where(eq(listeningInputs.lessonPackId, id))
    .limit(1);

  const savedAttempts = await db
    .select()
    .from(listeningAttempts)
    .where(eq(listeningAttempts.lessonPackId, id))
    .orderBy(desc(listeningAttempts.createdAt));

  const savedChunks = await db
    .select()
    .from(chunks)
    .where(eq(chunks.lessonPackId, id));

  const savedRoleplayTurns = await db
    .select()
    .from(roleplayTurns)
    .where(eq(roleplayTurns.lessonPackId, id));

  const savedRetryDrills = await db
    .select()
    .from(retryDrills)
    .where(eq(retryDrills.lessonPackId, id));

  return {
    lessonPack: lesson,
    lesson: lesson.validatedJson,
    listeningInput: input,
    listeningAttempts: savedAttempts,
    chunks: savedChunks,
    roleplayTurns: savedRoleplayTurns,
    retryDrills: savedRetryDrills
  };
}

export async function saveListeningAttempt(input: {
  lessonPackId: number;
  listeningInputId: number;
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
  const [attempt] = await db.insert(listeningAttempts).values(input).returning();
  return attempt;
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
      .values(
        input.feedback.error_log_items.map((item) => ({
          lessonPackId: input.lessonPackId,
          sourceType: "feedback" as const,
          errorType: item.type,
          evidence: item.evidence,
          correction: item.correction,
          whyItMatters: item.why_it_matters,
          retryPriority: item.retry_priority
        }))
      )
      .returning();

    const firstError = insertedErrors[0];
    const [retryDrill] = await tx
      .insert(retryDrills)
      .values({
        lessonPackId: input.lessonPackId,
        errorLogId: firstError?.id ?? null,
        instruction: input.feedback.retry_drill.instruction,
        itemsJson: input.feedback.retry_drill.items
      })
      .returning();

    return {
      modelOutputId: output.id,
      errorCount: insertedErrors.length,
      retryDrillId: retryDrill.id
    };
  });
}

export async function completeRetryDrill(id: number, learnerResult: string) {
  const db = getDb();
  const [drill] = await db
    .update(retryDrills)
    .set({
      learnerResult,
      completedAt: new Date()
    })
    .where(eq(retryDrills.id, id))
    .returning();

  return drill;
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

    return rows.map((row) => ({
      prompt: row.prompt,
      raw_response: row.rawResponse,
      feedback_json: row.parsedJson,
      source_mode: row.sourceMode,
      created_at: row.createdAt.toISOString()
    }));
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

    return rows.map((row) => ({
      source_error: row.evidence,
      correction: row.correction,
      retry_drill: {
        instruction: row.instruction,
        items: row.items
      }
    }));
  }

  const rows = await db
    .select()
    .from(modelOutputs)
    .where(eq(modelOutputs.accepted, false))
    .orderBy(desc(modelOutputs.createdAt));

  return rows.map((row) => ({
    prompt: row.prompt,
    broken_response: row.rawResponse,
    rejection_reason: row.rejectionReason,
    repaired_json: null,
    created_at: row.createdAt.toISOString()
  }));
}

function summarizeBy(values: string[]) {
  return values.reduce<Record<string, number>>((summary, value) => {
    summary[value] = (summary[value] ?? 0) + 1;
    return summary;
  }, {});
}
