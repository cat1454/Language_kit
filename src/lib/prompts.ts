import type { LessonPackV1 } from "@/src/lib/contracts";

export type LessonPromptInput = {
  targetLanguage: string;
  learnerNativeLanguage: string;
  cefrLevel: string;
  topic: string;
  situation: string;
  sessionMinutes: number;
  skillFocus: string;
};

export function buildLessonPackPrompt(input: LessonPromptInput): string {
  return [
    "Create one structured language practice lesson pack.",
    "Return valid JSON only. Do not include markdown fences, comments, or prose outside JSON.",
    "Use schema_version exactly lesson_pack.v1.",
    `Target language: ${input.targetLanguage}`,
    `Learner native language: ${input.learnerNativeLanguage}`,
    `CEFR level: ${input.cefrLevel}`,
    `Topic: ${input.topic}`,
    `Situation: ${input.situation}`,
    `Session length: ${input.sessionMinutes} minutes`,
    `Target skill focus: ${input.skillFocus}`,
    "The lesson must follow this order: pre-listening, listening checks, chunk mining, roleplay, writing, feedback rubric, retry drills.",
    "The listening script must be about 60-90 seconds.",
    "Include 5-8 reusable chunks.",
    "Do not reveal the full transcript through pre-listening or while-listening answers.",
    "Required top-level JSON keys: schema_version, topic, target_language, learner_native_language, cefr_level, situation, pre_listening, listening_input, while_listening, post_listening, roleplay, writing_task, rubric, retry_drills, quality_checks."
  ].join("\n");
}

export type RepairPromptInput = {
  brokenResponse: string;
  validationErrors: string[];
  expectedSchemaName: "lesson_pack.v1" | "feedback.v1";
};

export function buildRepairPrompt(input: RepairPromptInput): string {
  return [
    `Please repair this response so it matches ${input.expectedSchemaName}.`,
    "Return valid JSON only. Do not include markdown fences, comments, or prose outside JSON.",
    "Validation errors:",
    input.validationErrors.map((error) => `- ${error}`).join("\n"),
    "Broken response:",
    input.brokenResponse
  ].join("\n");
}

export type FeedbackPromptInput = {
  lessonPack: LessonPackV1;
  roleplayResponses: string[];
  writingDraft: string;
  listeningSummary: string;
};

export function buildFeedbackPrompt(input: FeedbackPromptInput): string {
  return [
    "Score this learner attempt and return feedback JSON only.",
    "Required keys: scores, error_log_items, positive_notes, retry_drill.",
    `Lesson topic: ${input.lessonPack.topic}`,
    `Situation: ${input.lessonPack.situation}`,
    `Target chunks: ${input.lessonPack.post_listening.chunks
      .map((chunk) => chunk.phrase)
      .join(", ")}`,
    `Listening summary: ${input.listeningSummary}`,
    `Roleplay responses: ${input.roleplayResponses.join(" | ")}`,
    `Writing draft: ${input.writingDraft}`,
    "Each error_log_items entry must include type, evidence, correction, why_it_matters, and retry_priority.",
    "retry_drill must contain an instruction and items."
  ].join("\n");
}
