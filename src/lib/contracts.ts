import { z } from "zod";

export const sourceModeSchema = z.enum([
  "manual_free_relay",
  "local_model",
  "paid_api"
]);

export const lessonPackStatusSchema = z.enum([
  "accepted",
  "rejected",
  "needs_repair"
]);

export const taskTypeSchema = z.enum([
  "lesson_generation",
  "json_repair",
  "feedback_scoring",
  "retry_generation"
]);

export const errorTypeSchema = z.enum([
  "grammar",
  "vocabulary",
  "naturalness",
  "pronunciation",
  "listening",
  "tone",
  "appropriateness"
]);

export const sourceTypeSchema = z.enum([
  "listening",
  "roleplay",
  "writing",
  "feedback"
]);

export const retryPrioritySchema = z.enum(["low", "medium", "high"]);

export const rejectionReasonSchema = z.enum([
  "invalid_json",
  "wrong_schema_version",
  "missing_required_section",
  "markdown_wrapper_included",
  "transcript_leak_risk",
  "not_cefr_appropriate",
  "too_few_chunks",
  "roleplay_not_tied_to_situation",
  "writing_task_unrelated",
  "feedback_lacks_retry_drill"
]);

const nonEmptyString = z.string().trim().min(1);

const qaSchema = z.object({
  question: nonEmptyString,
  answer: nonEmptyString
});

const chunkSchema = z.object({
  phrase: nonEmptyString,
  meaning: nonEmptyString,
  example: nonEmptyString
});

const retryDrillSchema = z.object({
  source: nonEmptyString.optional(),
  instruction: nonEmptyString,
  items: z.array(nonEmptyString).min(1)
});

export const lessonPackSchema = z
  .object({
    schema_version: z.literal("lesson_pack.v1"),
    topic: nonEmptyString,
    target_language: nonEmptyString,
    learner_native_language: nonEmptyString,
    cefr_level: nonEmptyString,
    situation: nonEmptyString,
    pre_listening: z.object({
      context_brief: nonEmptyString,
      prediction_questions: z.array(nonEmptyString).min(1),
      key_phrases_to_notice: z.array(nonEmptyString).min(1)
    }),
    listening_input: z.object({
      script: nonEmptyString,
      recommended_voice: nonEmptyString,
      accent: nonEmptyString,
      speed: nonEmptyString,
      duration_seconds: z.number().min(60).max(90)
    }),
    while_listening: z.object({
      gist_questions: z.array(qaSchema).min(1),
      detail_questions: z.array(qaSchema).min(1),
      key_phrase_recognition: z
        .array(
          z.object({
            phrase: nonEmptyString,
            meaning: nonEmptyString
          })
        )
        .min(1)
    }),
    post_listening: z.object({
      chunks: z.array(chunkSchema).min(5).max(8),
      shadowing_lines: z.array(nonEmptyString).min(1),
      listening_to_speaking_bridge: z.array(nonEmptyString).min(1)
    }),
    roleplay: z.object({
      learner_role: nonEmptyString,
      ai_role: nonEmptyString,
      turns: z
        .array(
          z.object({
            ai_prompt: nonEmptyString,
            learner_goal: nonEmptyString
          })
        )
        .min(1)
    }),
    writing_task: z.object({
      task: nonEmptyString,
      constraints: z.array(nonEmptyString).min(1),
      target_chunks_to_use: z.array(nonEmptyString).min(1)
    }),
    rubric: z.object({
      listening: z.array(nonEmptyString).min(1),
      speaking: z.array(nonEmptyString).min(1),
      writing: z.array(nonEmptyString).min(1)
    }),
    retry_drills: z.array(retryDrillSchema).min(1),
    quality_checks: z.object({
      level_is_cefr_appropriate: z.literal(true),
      uses_target_chunks: z.literal(true),
      no_answer_leak_before_listening: z.literal(true)
    })
  })
  .strict();

export const feedbackSchema = z
  .object({
    scores: z.object({
      gist: z.number().min(0).max(1),
      detail: z.number().min(0).max(1),
      chunk_recognition: z.number().min(0).max(1),
      response_readiness: z.number().min(0).max(1),
      output_transfer: z.number().min(0).max(1)
    }),
    error_log_items: z
      .array(
        z.object({
          type: errorTypeSchema,
          evidence: nonEmptyString,
          correction: nonEmptyString,
          why_it_matters: nonEmptyString,
          retry_priority: retryPrioritySchema
        })
      )
      .min(1),
    positive_notes: z.array(nonEmptyString).default([]),
    retry_drill: z.object({
      instruction: nonEmptyString,
      items: z.array(nonEmptyString).min(1)
    })
  })
  .strict();

export type SourceMode = z.infer<typeof sourceModeSchema>;
export type LessonPackStatus = z.infer<typeof lessonPackStatusSchema>;
export type TaskType = z.infer<typeof taskTypeSchema>;
export type ErrorType = z.infer<typeof errorTypeSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;
export type RejectionReason = z.infer<typeof rejectionReasonSchema>;
export type LessonPackV1 = z.infer<typeof lessonPackSchema>;
export type FeedbackV1 = z.infer<typeof feedbackSchema>;

type Success<T> = {
  success: true;
  data: T;
  errors: [];
  rejectionReason: null;
};

type Failure = {
  success: false;
  data?: never;
  errors: string[];
  rejectionReason: RejectionReason;
};

export type ValidationResult<T> = Success<T> | Failure;

export function parseAiJson(raw: string): ValidationResult<unknown> {
  const trimmed = raw.trim();

  if (trimmed.startsWith("```") || trimmed.endsWith("```")) {
    return {
      success: false,
      errors: ["AI response included a markdown code fence."],
      rejectionReason: "markdown_wrapper_included"
    };
  }

  try {
    return {
      success: true,
      data: JSON.parse(trimmed),
      errors: [],
      rejectionReason: null
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Invalid JSON."],
      rejectionReason: "invalid_json"
    };
  }
}

export function validateLessonPack(input: unknown): ValidationResult<LessonPackV1> {
  const parsed = lessonPackSchema.safeParse(input);

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
      errors: [],
      rejectionReason: null
    };
  }

  return {
    success: false,
    errors: parsed.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    }),
    rejectionReason: getLessonPackRejectionReason(input)
  };
}

export function validateFeedback(input: unknown): ValidationResult<FeedbackV1> {
  const parsed = feedbackSchema.safeParse(input);

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
      errors: [],
      rejectionReason: null
    };
  }

  return {
    success: false,
    errors: parsed.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    }),
    rejectionReason:
      isRecord(input) && !("retry_drill" in input)
        ? "feedback_lacks_retry_drill"
        : "missing_required_section"
  };
}

function getLessonPackRejectionReason(input: unknown): RejectionReason {
  if (!isRecord(input)) {
    return "missing_required_section";
  }

  if (input.schema_version !== "lesson_pack.v1") {
    return "wrong_schema_version";
  }

  const qualityChecks = input.quality_checks;
  if (
    isRecord(qualityChecks) &&
    qualityChecks.no_answer_leak_before_listening === false
  ) {
    return "transcript_leak_risk";
  }

  if (
    isRecord(qualityChecks) &&
    qualityChecks.level_is_cefr_appropriate === false
  ) {
    return "not_cefr_appropriate";
  }

  const postListening = input.post_listening;
  if (
    isRecord(postListening) &&
    Array.isArray(postListening.chunks) &&
    postListening.chunks.length < 5
  ) {
    return "too_few_chunks";
  }

  return "missing_required_section";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
