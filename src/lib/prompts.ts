import type { LessonPackV1 } from "@/src/lib/contracts";
import {
  feedbackSchemaGuide,
  lessonPackSchemaGuide
} from "@/src/lib/prompt-schema-guides";

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
    "Return raw JSON only. Do not include markdown fences, comments, or prose before or after JSON.",
    'Use schema_version exactly "lesson_pack.v1".',
    `Target language: ${input.targetLanguage}`,
    `Learner native language: ${input.learnerNativeLanguage}`,
    `CEFR level: ${input.cefrLevel}`,
    `Topic: ${input.topic}`,
    `Situation: ${input.situation}`,
    `Session length: ${input.sessionMinutes} minutes`,
    `Target skill focus: ${input.skillFocus}`,
    "The lesson must follow this listening-first order: pre-listening, listening input, listening checks, chunk mining, roleplay, writing, feedback rubric, retry drills.",
    lessonPackSchemaGuide,
    "Before final answer, silently check that the JSON parses, has no markdown fences, has 60-90 second listening input, has 5-8 chunks, keeps the transcript gated before listening checks, and follows lesson_pack.v1 exactly."
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
    "Return raw JSON only. Do not include markdown fences, comments, or prose before or after JSON.",
    feedbackSchemaGuide,
    `Lesson topic: ${input.lessonPack.topic}`,
    `Situation: ${input.lessonPack.situation}`,
    `Target chunks: ${input.lessonPack.post_listening.chunks
      .map((chunk) => chunk.phrase)
      .join(", ")}`,
    `Listening summary: ${input.listeningSummary}`,
    `Roleplay responses: ${input.roleplayResponses.join(" | ")}`,
    `Writing draft: ${input.writingDraft}`
  ].join("\n");
}
