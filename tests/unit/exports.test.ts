import { describe, expect, it } from "vitest";
import {
  buildFeedbackScoringExportRows,
  buildJsonRepairExportRows,
  buildLessonGenerationExportRows,
  buildRetryGenerationExportRows,
  formatJsonl
} from "@/src/lib/exports";
import { validFeedback, validLessonPack } from "@/src/demo/lesson-pack-fixture";

describe("dataset exports", () => {
  it("formats JSONL with one serialized object per line", () => {
    const jsonl = formatJsonl([{ a: 1 }, { b: "two" }]);

    expect(jsonl).toBe("{\"a\":1}\n{\"b\":\"two\"}\n");
  });

  it("returns an empty string for empty JSONL exports", () => {
    expect(formatJsonl([])).toBe("");
  });

  it("builds lesson generation export rows with prompt and accepted JSON", () => {
    const rows = buildLessonGenerationExportRows([
      {
        id: 1,
        prompt: "Generate a lesson",
        rawAiOutput: JSON.stringify(validLessonPack),
        validatedJson: validLessonPack,
        sourceMode: "manual_free_relay",
        rejectionReason: null,
        createdAt: new Date("2026-07-04T00:00:00.000Z")
      }
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      prompt: "Generate a lesson",
      accepted_normalized_json: validLessonPack,
      source_mode: "manual_free_relay"
    });
  });

  it("builds accepted feedback rows with explicit metadata", () => {
    const rows = buildFeedbackScoringExportRows([
      {
        taskType: "feedback_scoring",
        prompt: "Evaluate",
        rawResponse: JSON.stringify(validFeedback),
        parsedJson: validFeedback,
        accepted: true,
        rejectionReason: null,
        sourceMode: "manual_free_relay",
        providerOrSite: "manual",
        modelName: "unknown",
        createdAt: new Date("2026-07-04T00:00:00.000Z")
      }
    ]);

    expect(rows[0]).toMatchObject({
      task_type: "feedback_scoring",
      accepted: true,
      rejection_reason: null,
      raw_response: JSON.stringify(validFeedback),
      parsed_json: validFeedback,
      feedback_json: validFeedback,
      source_mode: "manual_free_relay",
      provider_or_site: "manual",
      model_name: "unknown"
    });
  });

  it("builds rejected feedback rows with clear rejection metadata", () => {
    const parsedJson = { scores: validFeedback.scores };
    const rows = buildFeedbackScoringExportRows([
      {
        taskType: "feedback_scoring",
        prompt: "Evaluate",
        rawResponse: JSON.stringify(parsedJson),
        parsedJson,
        accepted: false,
        rejectionReason: "feedback_lacks_retry_drill",
        sourceMode: "manual_free_relay",
        providerOrSite: null,
        modelName: null,
        createdAt: new Date("2026-07-04T00:00:00.000Z")
      }
    ]);

    expect(rows[0]).toMatchObject({
      task_type: "feedback_scoring",
      accepted: false,
      rejection_reason: "feedback_lacks_retry_drill",
      raw_response: JSON.stringify(parsedJson),
      parsed_json: parsedJson,
      source_mode: "manual_free_relay"
    });
    expect("feedback_json" in rows[0]).toBe(false);
  });

  it("excludes retry generation rows without a source error", () => {
    const rows = buildRetryGenerationExportRows([
      {
        instruction: "Seed retry",
        items: ["one"],
        evidence: null,
        correction: null
      },
      {
        instruction: "Rewrite politely",
        items: ["I want change meeting to Friday."],
        evidence: "I want change meeting to Friday.",
        correction: "I would like to reschedule the meeting for Friday."
      }
    ]);

    expect(rows).toEqual([
      {
        source_error: "I want change meeting to Friday.",
        correction: "I would like to reschedule the meeting for Friday.",
        retry_drill: {
          instruction: "Rewrite politely",
          items: ["I want change meeting to Friday."]
        }
      }
    ]);
  });

  it("builds JSON repair rows only from useful rejected outputs", () => {
    const rows = buildJsonRepairExportRows([
      {
        taskType: "lesson_generation",
        prompt: "Generate lesson_pack.v1",
        rawResponse: "{ bad json",
        parsedJson: null,
        accepted: false,
        rejectionReason: "invalid_json",
        createdAt: new Date("2026-07-04T00:00:00.000Z")
      },
      {
        taskType: "feedback_scoring",
        prompt: "Evaluate",
        rawResponse: JSON.stringify({ scores: validFeedback.scores }),
        parsedJson: { scores: validFeedback.scores },
        accepted: false,
        rejectionReason: "feedback_lacks_retry_drill",
        createdAt: new Date("2026-07-04T00:00:01.000Z")
      },
      {
        taskType: "feedback_scoring",
        prompt: "Accepted",
        rawResponse: JSON.stringify(validFeedback),
        parsedJson: validFeedback,
        accepted: true,
        rejectionReason: null,
        createdAt: new Date("2026-07-04T00:00:02.000Z")
      },
      {
        taskType: "json_repair",
        prompt: "Repair",
        rawResponse: "",
        parsedJson: null,
        accepted: false,
        rejectionReason: "invalid_json",
        createdAt: new Date("2026-07-04T00:00:03.000Z")
      }
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      task_type: "lesson_generation",
      accepted: false,
      broken_response: "{ bad json",
      rejection_reason: "invalid_json",
      has_parsed_json: false,
      repaired_json: null
    });
    expect(rows[1]).toMatchObject({
      task_type: "feedback_scoring",
      accepted: false,
      rejection_reason: "feedback_lacks_retry_drill",
      has_parsed_json: true,
      parsed_json: { scores: validFeedback.scores },
      repaired_json: null
    });
  });

  it("keeps JSONL parseable as one object per line", () => {
    const jsonl = formatJsonl([
      { task_type: "lesson_generation", accepted: false },
      { task_type: "feedback_scoring", accepted: true }
    ]);
    const parsedRows = jsonl.trimEnd().split("\n").map((line) => JSON.parse(line));

    expect(parsedRows).toEqual([
      { task_type: "lesson_generation", accepted: false },
      { task_type: "feedback_scoring", accepted: true }
    ]);
  });
});
