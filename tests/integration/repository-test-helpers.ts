import { getDb } from "@/src/db/client";
import { modelOutputs, topics } from "@/src/db/schema";
import { saveLessonPackSubmission } from "@/src/db/repository";
import { validLessonPack } from "@/src/demo/lesson-pack-fixture";

export async function cleanRepositoryDatabase() {
  const db = getDb();
  await db.delete(modelOutputs);
  await db.delete(topics);
}

export function saveValidAcceptedLesson() {
  return saveLessonPackSubmission({
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
}
