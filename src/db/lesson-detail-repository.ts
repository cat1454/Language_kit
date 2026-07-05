import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/src/db/client";
import {
  chunks,
  lessonPacks,
  listeningAttempts,
  listeningInputs,
  retryDrills,
  roleplayTurns,
  writingSubmissions
} from "@/src/db/schema";

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
    .where(eq(roleplayTurns.lessonPackId, id))
    .orderBy(asc(roleplayTurns.turnIndex));

  const [savedWritingSubmission] = await db
    .select()
    .from(writingSubmissions)
    .where(eq(writingSubmissions.lessonPackId, id))
    .limit(1);

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
    writingSubmission: savedWritingSubmission ?? null,
    retryDrills: savedRetryDrills
  };
}
