import { describe, expect, it } from "vitest";
import {
  parseAiJson,
  validateFeedback,
  validateLessonPack
} from "@/src/lib/contracts";
import { validFeedback, validLessonPack } from "@/src/demo/lesson-pack-fixture";

describe("AI data contracts", () => {
  it("accepts a valid lesson_pack.v1 object", () => {
    const result = validateLessonPack(validLessonPack);

    expect(result.success).toBe(true);
    expect(result.data?.schema_version).toBe("lesson_pack.v1");
  });

  it("rejects markdown-wrapped JSON before parsing", () => {
    const result = parseAiJson("```json\n{\"schema_version\":\"lesson_pack.v1\"}\n```");

    expect(result.success).toBe(false);
    expect(result.rejectionReason).toBe("markdown_wrapper_included");
  });

  it("rejects malformed JSON with invalid_json", () => {
    const result = parseAiJson("{ bad json");

    expect(result.success).toBe(false);
    expect(result.rejectionReason).toBe("invalid_json");
  });

  it("rejects non-lesson schema versions", () => {
    const result = validateLessonPack({
      ...validLessonPack,
      schema_version: "lesson_pack.v0"
    });

    expect(result.success).toBe(false);
    expect(result.rejectionReason).toBe("wrong_schema_version");
  });

  it("rejects lesson packs with too-short listening duration", () => {
    const result = validateLessonPack({
      ...validLessonPack,
      listening_input: {
        ...validLessonPack.listening_input,
        duration_seconds: 20
      }
    });

    expect(result.success).toBe(false);
    expect(result.errors.join(" ")).toContain("duration_seconds");
  });

  it("rejects lesson packs that leak answers before listening", () => {
    const result = validateLessonPack({
      ...validLessonPack,
      quality_checks: {
        ...validLessonPack.quality_checks,
        no_answer_leak_before_listening: false
      }
    });

    expect(result.success).toBe(false);
    expect(result.rejectionReason).toBe("transcript_leak_risk");
  });

  it("rejects lesson packs with too few chunks", () => {
    const result = validateLessonPack({
      ...validLessonPack,
      post_listening: {
        ...validLessonPack.post_listening,
        chunks: validLessonPack.post_listening.chunks.slice(0, 2)
      }
    });

    expect(result.success).toBe(false);
    expect(result.rejectionReason).toBe("too_few_chunks");
  });

  it("rejects lesson packs marked as not CEFR appropriate", () => {
    const result = validateLessonPack({
      ...validLessonPack,
      quality_checks: {
        ...validLessonPack.quality_checks,
        level_is_cefr_appropriate: false
      }
    });

    expect(result.success).toBe(false);
    expect(result.rejectionReason).toBe("not_cefr_appropriate");
  });

  it("accepts structured feedback with error log and retry drill", () => {
    const result = validateFeedback(validFeedback);

    expect(result.success).toBe(true);
    expect(result.data?.error_log_items[0]?.retry_priority).toBe("high");
  });

  it("rejects feedback that lacks a retry drill", () => {
    const { retry_drill: _retryDrill, ...feedbackWithoutRetry } = validFeedback;
    const result = validateFeedback(feedbackWithoutRetry);

    expect(result.success).toBe(false);
    expect(result.rejectionReason).toBe("feedback_lacks_retry_drill");
  });
});
