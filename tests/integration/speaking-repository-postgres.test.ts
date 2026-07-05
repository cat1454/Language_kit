import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/src/db/client";
import { modelOutputs, speakingAttempts, topics } from "@/src/db/schema";
import {
  getLessonPackDetail,
  saveLessonPackSubmission,
  saveSpeakingAttempt
} from "@/src/db/repository";
import { validLessonPack } from "@/src/demo/lesson-pack-fixture";

const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("speaking PostgreSQL repository integration", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it("adds a speaking attempt without changing existing lesson loading", async () => {
    const savedLesson = await saveLessonPackSubmission({
      prompt: "Generate lesson_pack.v1",
      rawAiOutput: JSON.stringify(validLessonPack),
      parsedJson: validLessonPack,
      validatedJson: validLessonPack,
      sourceMode: "manual_free_relay",
      status: "accepted",
      rejectionReason: null
    });
    const lessonPackId = savedLesson.id as number;

    const savedAttempt = await saveSpeakingAttempt({
      lessonPackId,
      promptType: "roleplay",
      promptRef: "Ask to move the meeting politely.",
      transcript: "Could we reschedule for Friday?",
      sttProvider: "manual",
      sttStatus: "completed"
    });
    const detail = await getLessonPackDetail(lessonPackId);
    const db = getDb();
    const [storedAttempt] = await db
      .select()
      .from(speakingAttempts)
      .where(eq(speakingAttempts.id, savedAttempt?.id ?? 0));

    expect(storedAttempt).toMatchObject({
      userId: 1,
      lessonPackId,
      promptType: "roleplay",
      audioPath: null,
      transcript: "Could we reschedule for Friday?",
      sttProvider: "manual",
      sttStatus: "completed"
    });
    expect(detail?.lessonPack.id).toBe(lessonPackId);
    expect(detail?.lesson.schema_version).toBe("lesson_pack.v1");
  });

  it("returns null instead of inserting for a missing lesson", async () => {
    const savedAttempt = await saveSpeakingAttempt({
      lessonPackId: 999,
      promptType: "roleplay",
      promptRef: null,
      transcript: "Manual transcript",
      sttProvider: "manual",
      sttStatus: "completed"
    });

    expect(savedAttempt).toBeNull();
    await expect(getDb().select().from(speakingAttempts)).resolves.toHaveLength(0);
  });
});

async function cleanDatabase() {
  const db = getDb();
  await db.delete(modelOutputs);
  await db.delete(topics);
}
