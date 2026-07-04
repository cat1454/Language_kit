import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/src/db/client";
import { modelOutputs, topics } from "@/src/db/schema";
import {
  getDatasetExportRows,
  listLessonPacks,
  saveLessonPackSubmission
} from "@/src/db/repository";
import { validLessonPack } from "@/src/demo/lesson-pack-fixture";

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
});

async function cleanDatabase() {
  const db = getDb();
  await db.delete(modelOutputs);
  await db.delete(topics);
}
