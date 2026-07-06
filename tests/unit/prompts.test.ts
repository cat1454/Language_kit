import { describe, expect, it } from "vitest";
import {
  buildFeedbackPrompt,
  buildLessonPackPrompt,
  buildRepairPrompt
} from "@/src/lib/prompts";
import { validLessonPack } from "@/src/demo/lesson-pack-fixture";

describe("prompt generation", () => {
  it("builds a strict lesson-pack prompt from learner input", () => {
    const prompt = buildLessonPackPrompt({
      targetLanguage: "English",
      learnerNativeLanguage: "Vietnamese",
      cefrLevel: "B1",
      topic: "Reschedule a meeting",
      situation: "A workplace meeting must be moved because of a scheduling conflict.",
      sessionMinutes: 30,
      skillFocus: "listening first"
    });

    expect(prompt).toContain("lesson_pack.v1");
    expect(prompt).toContain("English");
    expect(prompt).toContain("Vietnamese");
    expect(prompt).toContain("B1");
    expect(prompt).toContain("raw JSON only");
    expect(prompt).toContain("Do not include markdown fences");
    expect(prompt).not.toContain("```");
  });

  it("includes compact lesson_pack.v1 schema guidance", () => {
    const prompt = buildLessonPackPrompt({
      targetLanguage: "English",
      learnerNativeLanguage: "Vietnamese",
      cefrLevel: "B1",
      topic: "Reschedule a meeting",
      situation: "A workplace meeting must be moved because of a scheduling conflict.",
      sessionMinutes: 30,
      skillFocus: "listening first"
    });

    expect(prompt).toContain('schema_version must be exactly "lesson_pack.v1"');
    expect(prompt).toContain("listening-first order");
    expect(prompt).toContain("60-90 seconds");
    expect(prompt).toContain("5-8");
    expect(prompt).toContain("do not reveal");
    expect(prompt).toContain("comprehension_checks");
    expect(prompt).toContain("listening_input");
    expect(prompt).toContain("post_listening");
    expect(prompt).toContain("roleplay");
    expect(prompt).toContain("writing_task");
    expect(prompt).toContain("retry_drills");
    expect(prompt).toContain("quality_checks");
  });

  it("builds a repair prompt with the broken response and validation errors", () => {
    const prompt = buildRepairPrompt({
      brokenResponse: "{ bad json",
      validationErrors: ["invalid JSON", "missing roleplay"],
      expectedSchemaName: "lesson_pack.v1"
    });

    expect(prompt).toContain("repair");
    expect(prompt).toContain("lesson_pack.v1");
    expect(prompt).toContain("{ bad json");
    expect(prompt).toContain("missing roleplay");
    expect(prompt).not.toContain("```");
  });

  it("builds a feedback prompt tied to the lesson and learner attempt", () => {
    const prompt = buildFeedbackPrompt({
      lessonPack: validLessonPack,
      roleplayResponses: ["I have scheduling conflict. Can we move it?"],
      writingDraft: "Hi Maya, I want change meeting to Friday.",
      listeningSummary: "Missed the proposed time."
    });

    expect(prompt).toContain("feedback JSON");
    expect(prompt).toContain("feedback.v1");
    expect(prompt).toContain("raw JSON only");
    expect(prompt).toContain("Do not include markdown fences");
    expect(prompt).toContain("Reschedule a meeting");
    expect(prompt).toContain("Missed the proposed time");
    expect(prompt).toContain("evidence");
    expect(prompt).toContain("correction");
    expect(prompt).toContain("why_it_matters");
    expect(prompt).toContain("retry_drill");
    expect(prompt).not.toContain("```");
  });
});
