import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/src/db/client";
import {
  errorLog,
  lessonPacks,
  listeningAttempts,
  listeningInputs,
  modelOutputs,
  retryDrills,
  topics
} from "@/src/db/schema";
import {
  completeRetryDrill,
  getDashboardSummary,
  getDatasetExportRows,
  getLessonPackDetail,
  listLessonPacks,
  saveFeedback,
  saveListeningAttempt,
  saveLessonPackSubmission,
  saveRejectedFeedbackOutput,
  saveWritingDraft
} from "@/src/db/repository";
import { validFeedback, validLessonPack } from "@/src/demo/lesson-pack-fixture";

const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("PostgreSQL repository integration", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it("persists an accepted lesson pack and exposes it for listing/export", async () => {
    const saved = await saveLessonPackSubmission({
      prompt: "Generate lesson_pack.v1",
      rawAiOutput: JSON.stringify(validLessonPack),
      parsedJson: validLessonPack,
      validatedJson: validLessonPack,
      sourceMode: "manual_free_relay",
      providerOrSite: "manual",
      modelName: "unknown",
      status: "accepted",
      rejectionReason: null,
      sessionMinutes: 30
    });

    const lessons = await listLessonPacks();
    const rows = await getDatasetExportRows("lesson_generation_sft");

    expect(saved.id).toEqual(expect.any(Number));
    expect(lessons[0]).toMatchObject({
      id: saved.id,
      topic: "Reschedule a meeting",
      status: "accepted"
    });
    expect(rows[0]).toMatchObject({
      prompt: "Generate lesson_pack.v1",
      source_mode: "manual_free_relay"
    });
  });

  it("persists rejected output in model_outputs without creating a lesson", async () => {
    const saved = await saveLessonPackSubmission({
      prompt: "Generate lesson_pack.v1",
      rawAiOutput: "{ bad json",
      parsedJson: null,
      validatedJson: null,
      sourceMode: "manual_free_relay",
      providerOrSite: "manual",
      modelName: "unknown",
      status: "rejected",
      rejectionReason: "invalid_json"
    });

    const lessons = await listLessonPacks();
    const repairRows = await getDatasetExportRows("json_repair_sft");

    expect(saved.id).toBeNull();
    expect(saved.modelOutputId).toEqual(expect.any(Number));
    expect(lessons).toHaveLength(0);
    expect(repairRows[0]).toMatchObject({
      broken_response: "{ bad json",
      rejection_reason: "invalid_json"
    });
  });

  it("persists listening, feedback, retry completion, and dashboard progress", async () => {
    const saved = await saveLessonPackSubmission({
      prompt: "Generate lesson_pack.v1",
      rawAiOutput: JSON.stringify(validLessonPack),
      parsedJson: validLessonPack,
      validatedJson: validLessonPack,
      sourceMode: "manual_free_relay",
      status: "accepted",
      rejectionReason: null
    });
    const lessonPackId = saved.id as number;

    const attempt = await saveListeningAttempt({
      lessonPackId,
      gistAnswers: ["To reschedule a meeting."],
      detailAnswers: ["A scheduling conflict.", "Friday at 3."],
      keyPhraseAnswers: ["Could we reschedule it?"],
      replayCount: 1,
      scoreGist: 1,
      scoreDetail: 1,
      scoreKeyPhrase: 1,
      missedDetails: []
    });
    const initialDetail = await getLessonPackDetail(lessonPackId);
    const writingSubmission = initialDetail?.writingSubmission;
    if (!writingSubmission) throw new Error("Expected writing submission seed.");
    await saveWritingDraft({
      lessonId: lessonPackId,
      writingSubmissionId: writingSubmission.id,
      draft: "Sorry for the inconvenience. Would Friday at 3 work for you?"
    });
    const feedback = await saveFeedback({
      lessonPackId,
      prompt: "Evaluate the learner attempt",
      rawAiOutput: JSON.stringify(validFeedback),
      feedback: validFeedback,
      sourceMode: "manual_free_relay"
    });
    expect(feedback).not.toBeNull();
    if (!feedback) throw new Error("Expected feedback to be saved.");
    await completeRetryDrill(feedback.retryDrillId, "I would like to reschedule.");

    const detail = await getLessonPackDetail(lessonPackId);
    const dashboard = await getDashboardSummary();

    expect(attempt?.listeningInputId).toEqual(expect.any(Number));
    expect(detail?.listeningAttempts).toHaveLength(1);
    expect(detail?.writingSubmission?.draft).toBe(
      "Sorry for the inconvenience. Would Friday at 3 work for you?"
    );
    expect(detail?.writingSubmission?.feedbackJson).toEqual(validFeedback);
    expect(detail?.writingSubmission?.rubricScoresJson).toEqual(validFeedback.scores);
    expect(detail?.writingSubmission?.correctedVersion).toBeNull();
    expect(detail?.retryDrills.some((drill) => drill.completedAt)).toBe(true);
    expect(dashboard).toMatchObject({
      completedTopics: 1,
      completedRetryDrills: 1,
      repeatedErrorTypes: { naturalness: 1 }
    });
  });

  it("uses the single-user placeholder default for parent and practice rows", async () => {
    const saved = await saveLessonPackSubmission({
      prompt: "Generate lesson_pack.v1",
      rawAiOutput: JSON.stringify(validLessonPack),
      parsedJson: validLessonPack,
      validatedJson: validLessonPack,
      sourceMode: "manual_free_relay",
      status: "accepted",
      rejectionReason: null
    });
    const lessonPackId = saved.id as number;

    const attempt = await saveListeningAttempt({
      lessonPackId,
      gistAnswers: ["To reschedule a meeting."],
      detailAnswers: ["A scheduling conflict.", "Friday at 3."],
      keyPhraseAnswers: ["Could we reschedule it?"],
      replayCount: 1,
      scoreGist: 1,
      scoreDetail: 1,
      scoreKeyPhrase: 1,
      missedDetails: []
    });

    const db = getDb();
    const [lessonRow] = await db
      .select({ userId: lessonPacks.userId })
      .from(lessonPacks)
      .where(eq(lessonPacks.id, lessonPackId));
    const [attemptRow] = await db
      .select({ userId: listeningAttempts.userId })
      .from(listeningAttempts)
      .where(eq(listeningAttempts.id, attempt?.id ?? 0));

    expect(lessonRow?.userId).toBe(1);
    expect(attemptRow?.userId).toBe(1);
  });

  it("loads legacy audio paths and optional Listening v2 metadata", async () => {
    const saved = await saveLessonPackSubmission({
      prompt: "Generate lesson_pack.v1",
      rawAiOutput: JSON.stringify(validLessonPack),
      parsedJson: validLessonPack,
      validatedJson: validLessonPack,
      sourceMode: "manual_free_relay",
      status: "accepted",
      rejectionReason: null
    });
    const lessonPackId = saved.id as number;
    const db = getDb();
    await db
      .update(listeningInputs)
      .set({ audioPath: "/audio/lessons/legacy.mp3" })
      .where(eq(listeningInputs.lessonPackId, lessonPackId));

    const legacyDetail = await getLessonPackDetail(lessonPackId);
    expect(legacyDetail?.listeningInput).toMatchObject({
      audioPath: "/audio/lessons/legacy.mp3",
      audioMetadataJson: null
    });

    await db
      .update(listeningInputs)
      .set({
        audioMetadataJson: {
          defaultVoiceId: "default",
          variants: [{
            voiceId: "default",
            label: "Default voice",
            audioPath: "/audio/lessons/default.mp3"
          }],
          chunkTimings: [{ chunkIndex: 0, startMs: 0, endMs: 5000 }],
          durationMs: 65000
        }
      })
      .where(eq(listeningInputs.lessonPackId, lessonPackId));

    const metadataDetail = await getLessonPackDetail(lessonPackId);
    expect(metadataDetail?.listeningInput?.audioMetadataJson).toMatchObject({
      defaultVoiceId: "default",
      durationMs: 65000
    });
  });

  it("returns null for feedback targeting a missing lesson without orphan inserts", async () => {
    const result = await saveFeedback({
      lessonPackId: 999,
      prompt: "Evaluate the learner attempt",
      rawAiOutput: JSON.stringify(validFeedback),
      feedback: validFeedback,
      sourceMode: "manual_free_relay"
    });

    const db = getDb();
    const outputs = await db.select().from(modelOutputs);
    const errors = await db.select().from(errorLog);
    const drills = await db.select().from(retryDrills);

    expect(result).toBeNull();
    expect(outputs).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(drills).toHaveLength(0);
  });

  it("persists rejected feedback output without creating feedback side effects", async () => {
    const saved = await saveLessonPackSubmission({
      prompt: "Generate lesson_pack.v1",
      rawAiOutput: JSON.stringify(validLessonPack),
      parsedJson: validLessonPack,
      validatedJson: validLessonPack,
      sourceMode: "manual_free_relay",
      status: "accepted",
      rejectionReason: null
    });
    const db = getDb();
    const beforeErrors = await db.select().from(errorLog);
    const beforeDrills = await db.select().from(retryDrills);

    const rejected = await saveRejectedFeedbackOutput({
      lessonPackId: saved.id as number,
      prompt: "Evaluate the learner attempt",
      rawAiOutput: JSON.stringify({ scores: validFeedback.scores }),
      parsedJson: { scores: validFeedback.scores },
      rejectionReason: "feedback_lacks_retry_drill",
      sourceMode: "manual_free_relay"
    });

    const outputs = await db.select().from(modelOutputs);
    const afterErrors = await db.select().from(errorLog);
    const afterDrills = await db.select().from(retryDrills);

    expect(rejected).not.toBeNull();
    expect(outputs.find((output) => output.id === rejected?.modelOutputId)).toMatchObject({
      taskType: "feedback_scoring",
      accepted: false,
      rejectionReason: "feedback_lacks_retry_drill",
      parsedJson: { scores: validFeedback.scores }
    });
    expect(afterErrors).toHaveLength(beforeErrors.length);
    expect(afterDrills).toHaveLength(beforeDrills.length);
  });
});

async function cleanDatabase() {
  const db = getDb();
  await db.delete(modelOutputs);
  await db.delete(topics);
}
