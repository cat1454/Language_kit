import { describe, expect, it } from "vitest";
import { validFeedback } from "@/src/demo/lesson-pack-fixture";
import { buildWritingFeedbackPatch } from "@/src/lib/feedback-persistence";

describe("buildWritingFeedbackPatch", () => {
  it("maps accepted feedback onto writing feedback fields", () => {
    const patch = buildWritingFeedbackPatch(validFeedback);

    expect(patch.feedbackJson).toEqual(validFeedback);
    expect(patch.rubricScoresJson).toEqual(validFeedback.scores);
  });

  it("does not invent a corrected writing version from feedback.v1", () => {
    const patch = buildWritingFeedbackPatch(validFeedback);

    expect(Object.prototype.hasOwnProperty.call(patch, "correctedVersion")).toBe(false);
  });
});
