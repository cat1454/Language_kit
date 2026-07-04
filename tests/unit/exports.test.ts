import { describe, expect, it } from "vitest";
import {
  buildLessonGenerationExportRows,
  formatJsonl
} from "@/src/lib/exports";
import { validLessonPack } from "@/src/demo/lesson-pack-fixture";

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
});
