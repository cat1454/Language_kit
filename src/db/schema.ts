import type { FeedbackV1, LessonPackV1 } from "@/src/lib/contracts";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp
} from "drizzle-orm/pg-core";

export const sourceModeEnum = pgEnum("source_mode", [
  "manual_free_relay",
  "local_model",
  "paid_api"
]);

export const lessonPackStatusEnum = pgEnum("lesson_pack_status", [
  "accepted",
  "rejected",
  "needs_repair"
]);

export const taskTypeEnum = pgEnum("task_type", [
  "lesson_generation",
  "json_repair",
  "feedback_scoring",
  "retry_generation"
]);

export const sourceTypeEnum = pgEnum("source_type", [
  "listening",
  "roleplay",
  "writing",
  "feedback"
]);

export const errorTypeEnum = pgEnum("error_type", [
  "grammar",
  "vocabulary",
  "naturalness",
  "pronunciation",
  "listening",
  "tone",
  "appropriateness"
]);

const createdAt = timestamp("created_at", { withTimezone: true })
  .defaultNow()
  .notNull();

export const topics = pgTable("topics", {
  id: bigint("id", { mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  topic: text("topic").notNull(),
  targetLanguage: text("target_language").notNull(),
  learnerNativeLanguage: text("learner_native_language").notNull(),
  cefrLevel: text("cefr_level").notNull(),
  situation: text("situation").notNull(),
  sessionMinutes: integer("session_minutes").notNull(),
  createdAt,
  completedAt: timestamp("completed_at", { withTimezone: true })
});

export const lessonPacks = pgTable(
  "lesson_packs",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    topicId: bigint("topic_id", { mode: "number" }).references(() => topics.id, {
      onDelete: "cascade"
    }),
    schemaVersion: text("schema_version"),
    prompt: text("prompt").notNull(),
    rawAiOutput: text("raw_ai_output").notNull(),
    validatedJson: jsonb("validated_json").$type<LessonPackV1 | null>(),
    sourceMode: sourceModeEnum("source_mode").notNull(),
    providerOrSite: text("provider_or_site"),
    modelName: text("model_name"),
    status: lessonPackStatusEnum("status").notNull(),
    rejectionReason: text("rejection_reason"),
    createdAt,
    acceptedAt: timestamp("accepted_at", { withTimezone: true })
  },
  (table) => [
    index("lesson_packs_topic_id_idx").on(table.topicId),
    index("lesson_packs_status_created_at_idx").on(table.status, table.createdAt)
  ]
);

export const listeningInputs = pgTable(
  "listening_inputs",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    lessonPackId: bigint("lesson_pack_id", { mode: "number" })
      .notNull()
      .references(() => lessonPacks.id, { onDelete: "cascade" }),
    script: text("script").notNull(),
    audioPath: text("audio_path"),
    recommendedVoice: text("recommended_voice").notNull(),
    accent: text("accent").notNull(),
    speed: text("speed").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    transcriptVisibleAfterAttempt: boolean("transcript_visible_after_attempt")
      .default(true)
      .notNull()
  },
  (table) => [index("listening_inputs_lesson_pack_id_idx").on(table.lessonPackId)]
);

export const listeningAttempts = pgTable(
  "listening_attempts",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    lessonPackId: bigint("lesson_pack_id", { mode: "number" })
      .notNull()
      .references(() => lessonPacks.id, { onDelete: "cascade" }),
    listeningInputId: bigint("listening_input_id", { mode: "number" })
      .notNull()
      .references(() => listeningInputs.id, { onDelete: "cascade" }),
    gistAnswers: jsonb("gist_answers").$type<string[]>().notNull(),
    detailAnswers: jsonb("detail_answers").$type<string[]>().notNull(),
    keyPhraseAnswers: jsonb("key_phrase_answers").$type<string[]>().notNull(),
    replayCount: integer("replay_count").default(0).notNull(),
    scoreGist: real("score_gist").default(0).notNull(),
    scoreDetail: real("score_detail").default(0).notNull(),
    scoreKeyPhrase: real("score_key_phrase").default(0).notNull(),
    missedDetails: jsonb("missed_details").$type<string[]>().notNull(),
    createdAt
  },
  (table) => [
    index("listening_attempts_lesson_pack_id_idx").on(table.lessonPackId),
    index("listening_attempts_created_at_idx").on(table.createdAt)
  ]
);

export const chunks = pgTable(
  "chunks",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    lessonPackId: bigint("lesson_pack_id", { mode: "number" })
      .notNull()
      .references(() => lessonPacks.id, { onDelete: "cascade" }),
    phrase: text("phrase").notNull(),
    meaning: text("meaning").notNull(),
    example: text("example").notNull(),
    sourceContext: text("source_context"),
    timesRecognized: integer("times_recognized").default(0).notNull(),
    timesReusedCorrectly: integer("times_reused_correctly").default(0).notNull(),
    createdAt
  },
  (table) => [index("chunks_lesson_pack_id_idx").on(table.lessonPackId)]
);

export const roleplayTurns = pgTable(
  "roleplay_turns",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    lessonPackId: bigint("lesson_pack_id", { mode: "number" })
      .notNull()
      .references(() => lessonPacks.id, { onDelete: "cascade" }),
    turnIndex: integer("turn_index").notNull(),
    aiPrompt: text("ai_prompt").notNull(),
    learnerGoal: text("learner_goal").notNull(),
    learnerResponse: text("learner_response"),
    feedbackJson: jsonb("feedback_json").$type<FeedbackV1 | null>(),
    createdAt
  },
  (table) => [index("roleplay_turns_lesson_pack_id_idx").on(table.lessonPackId)]
);

export const writingSubmissions = pgTable(
  "writing_submissions",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    lessonPackId: bigint("lesson_pack_id", { mode: "number" })
      .notNull()
      .references(() => lessonPacks.id, { onDelete: "cascade" }),
    task: text("task").notNull(),
    constraintsJson: jsonb("constraints_json").$type<string[]>().notNull(),
    targetChunksJson: jsonb("target_chunks_json").$type<string[]>().notNull(),
    draft: text("draft"),
    correctedVersion: text("corrected_version"),
    rubricScoresJson: jsonb("rubric_scores_json"),
    feedbackJson: jsonb("feedback_json").$type<FeedbackV1 | null>(),
    createdAt
  },
  (table) => [
    index("writing_submissions_lesson_pack_id_idx").on(table.lessonPackId)
  ]
);

export const errorLog = pgTable(
  "error_log",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    lessonPackId: bigint("lesson_pack_id", { mode: "number" })
      .notNull()
      .references(() => lessonPacks.id, { onDelete: "cascade" }),
    sourceType: sourceTypeEnum("source_type").notNull(),
    errorType: errorTypeEnum("error_type").notNull(),
    evidence: text("evidence").notNull(),
    correction: text("correction").notNull(),
    whyItMatters: text("why_it_matters").notNull(),
    retryPriority: text("retry_priority").notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt
  },
  (table) => [
    index("error_log_lesson_pack_id_idx").on(table.lessonPackId),
    index("error_log_error_type_idx").on(table.errorType)
  ]
);

export const retryDrills = pgTable(
  "retry_drills",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    lessonPackId: bigint("lesson_pack_id", { mode: "number" })
      .notNull()
      .references(() => lessonPacks.id, { onDelete: "cascade" }),
    errorLogId: bigint("error_log_id", { mode: "number" }).references(
      () => errorLog.id,
      { onDelete: "set null" }
    ),
    instruction: text("instruction").notNull(),
    itemsJson: jsonb("items_json").$type<string[]>().notNull(),
    learnerResult: text("learner_result"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt
  },
  (table) => [
    index("retry_drills_lesson_pack_id_idx").on(table.lessonPackId),
    index("retry_drills_error_log_id_idx").on(table.errorLogId),
    index("retry_drills_completed_at_idx").on(table.completedAt)
  ]
);

export const modelOutputs = pgTable(
  "model_outputs",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    taskType: taskTypeEnum("task_type").notNull(),
    sourceMode: sourceModeEnum("source_mode").notNull(),
    providerOrSite: text("provider_or_site"),
    modelName: text("model_name"),
    prompt: text("prompt").notNull(),
    rawResponse: text("raw_response").notNull(),
    parsedJson: jsonb("parsed_json"),
    accepted: boolean("accepted").notNull(),
    rejectionReason: text("rejection_reason"),
    createdAt
  },
  (table) => [
    index("model_outputs_task_type_idx").on(table.taskType),
    index("model_outputs_source_mode_idx").on(table.sourceMode),
    index("model_outputs_created_at_idx").on(table.createdAt)
  ]
);
