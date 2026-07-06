import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/src/db/client";
import {
  errorLog,
  lessonPacks,
  listeningAttempts,
  retryDrills,
  roleplayTurns,
  speakingAttempts,
  topics,
  writingSubmissions
} from "@/src/db/schema";
import {
  buildReviewQueue,
  type ReviewQueue
} from "@/src/lib/adaptive-review";

const SINGLE_USER_ID = 1;

export async function getReviewQueue(input: {
  lessonId?: number;
  limit?: number;
} = {}): Promise<ReviewQueue> {
  const db = getDb();
  const lessonWhere = baseLessonWhere(input.lessonId);

  const [
    retryRows,
    errorRows,
    listeningRows,
    writingRows,
    roleplayRows,
    speakingRows
  ] = await Promise.all([
    db
      .select({
        id: retryDrills.id,
        lessonId: retryDrills.lessonPackId,
        lessonTitle: topics.topic,
        instruction: retryDrills.instruction,
        items: retryDrills.itemsJson,
        errorLogId: retryDrills.errorLogId,
        learnerResult: retryDrills.learnerResult,
        completedAt: retryDrills.completedAt,
        createdAt: retryDrills.createdAt
      })
      .from(retryDrills)
      .innerJoin(lessonPacks, eq(retryDrills.lessonPackId, lessonPacks.id))
      .leftJoin(topics, eq(lessonPacks.topicId, topics.id))
      .where(and(lessonWhere, eq(retryDrills.userId, SINGLE_USER_ID)))
      .orderBy(desc(retryDrills.createdAt)),
    db
      .select({
        id: errorLog.id,
        lessonId: errorLog.lessonPackId,
        lessonTitle: topics.topic,
        errorType: errorLog.errorType,
        evidence: errorLog.evidence,
        correction: errorLog.correction,
        retryPriority: errorLog.retryPriority,
        resolvedAt: errorLog.resolvedAt,
        createdAt: errorLog.createdAt
      })
      .from(errorLog)
      .innerJoin(lessonPacks, eq(errorLog.lessonPackId, lessonPacks.id))
      .leftJoin(topics, eq(lessonPacks.topicId, topics.id))
      .where(and(
        lessonWhere,
        eq(errorLog.userId, SINGLE_USER_ID),
        eq(errorLog.sourceType, "feedback")
      ))
      .orderBy(desc(errorLog.createdAt)),
    db
      .select({
        id: listeningAttempts.id,
        lessonId: listeningAttempts.lessonPackId,
        lessonTitle: topics.topic,
        scoreGist: listeningAttempts.scoreGist,
        scoreDetail: listeningAttempts.scoreDetail,
        scoreKeyPhrase: listeningAttempts.scoreKeyPhrase,
        missedDetails: listeningAttempts.missedDetails,
        createdAt: listeningAttempts.createdAt
      })
      .from(listeningAttempts)
      .innerJoin(lessonPacks, eq(listeningAttempts.lessonPackId, lessonPacks.id))
      .leftJoin(topics, eq(lessonPacks.topicId, topics.id))
      .where(and(lessonWhere, eq(listeningAttempts.userId, SINGLE_USER_ID)))
      .orderBy(desc(listeningAttempts.createdAt)),
    db
      .select({
        id: writingSubmissions.id,
        lessonId: writingSubmissions.lessonPackId,
        lessonTitle: topics.topic,
        task: writingSubmissions.task,
        draft: writingSubmissions.draft,
        correctedVersion: writingSubmissions.correctedVersion,
        feedbackJson: writingSubmissions.feedbackJson,
        createdAt: writingSubmissions.createdAt
      })
      .from(writingSubmissions)
      .innerJoin(lessonPacks, eq(writingSubmissions.lessonPackId, lessonPacks.id))
      .leftJoin(topics, eq(lessonPacks.topicId, topics.id))
      .where(and(lessonWhere, eq(writingSubmissions.userId, SINGLE_USER_ID)))
      .orderBy(desc(writingSubmissions.createdAt)),
    db
      .select({
        id: roleplayTurns.id,
        lessonId: roleplayTurns.lessonPackId,
        lessonTitle: topics.topic,
        turnIndex: roleplayTurns.turnIndex,
        learnerGoal: roleplayTurns.learnerGoal,
        learnerResponse: roleplayTurns.learnerResponse,
        feedbackJson: roleplayTurns.feedbackJson,
        createdAt: roleplayTurns.createdAt
      })
      .from(roleplayTurns)
      .innerJoin(lessonPacks, eq(roleplayTurns.lessonPackId, lessonPacks.id))
      .leftJoin(topics, eq(lessonPacks.topicId, topics.id))
      .where(and(lessonWhere, eq(roleplayTurns.userId, SINGLE_USER_ID)))
      .orderBy(desc(roleplayTurns.createdAt)),
    db
      .select({
        id: speakingAttempts.id,
        lessonId: speakingAttempts.lessonPackId,
        lessonTitle: topics.topic,
        promptType: speakingAttempts.promptType,
        promptRef: speakingAttempts.promptRef,
        transcript: speakingAttempts.transcript,
        sourceUpdatedAt: speakingAttempts.updatedAt,
        createdAt: speakingAttempts.createdAt
      })
      .from(speakingAttempts)
      .innerJoin(lessonPacks, eq(speakingAttempts.lessonPackId, lessonPacks.id))
      .leftJoin(topics, eq(lessonPacks.topicId, topics.id))
      .where(and(lessonWhere, eq(speakingAttempts.userId, SINGLE_USER_ID)))
      .orderBy(desc(speakingAttempts.createdAt))
  ]);

  return buildReviewQueue({
    retryDrills: retryRows,
    feedbackErrors: errorRows,
    listeningAttempts: listeningRows,
    writingSubmissions: writingRows,
    roleplayTurns: roleplayRows,
    speakingAttempts: speakingRows
  }, { limit: input.limit });
}

function baseLessonWhere(lessonId: number | undefined) {
  const required = and(
    eq(lessonPacks.userId, SINGLE_USER_ID),
    eq(lessonPacks.status, "accepted")
  );
  return lessonId ? and(required, eq(lessonPacks.id, lessonId)) : required;
}
