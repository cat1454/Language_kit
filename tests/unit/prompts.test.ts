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
    expect(prompt).toContain("valid JSON only");
    expect(prompt).not.toContain("```");
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
    expect(prompt).toContain("Reschedule a meeting");
    expect(prompt).toContain("Missed the proposed time");
    expect(prompt).toContain("retry_drill");
  });
});
