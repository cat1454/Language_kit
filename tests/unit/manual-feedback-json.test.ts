import { describe, expect, it } from "vitest";
import { validFeedback } from "@/src/demo/lesson-pack-fixture";
import { validateFeedback } from "@/src/lib/contracts";
import { parseManualFeedbackJson } from "@/src/lib/manual-feedback-json";

describe("parseManualFeedbackJson", () => {
  it("parses plain feedback JSON without changing fields", () => {
    const parsed = parseManualFeedbackJson(JSON.stringify(validFeedback));

    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual(validFeedback);
  });

  it("parses feedback JSON wrapped in a json code fence", () => {
    const parsed = parseManualFeedbackJson(`\`\`\`json\n${JSON.stringify(validFeedback)}\n\`\`\``);

    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual(validFeedback);
  });

  it("parses feedback JSON wrapped in an unlabeled code fence", () => {
    const parsed = parseManualFeedbackJson(`\`\`\`\n${JSON.stringify(validFeedback)}\n\`\`\``);

    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual(validFeedback);
  });

  it("rejects invalid JSON instead of extracting from prose", () => {
    const parsed = parseManualFeedbackJson(`Here is the object:\n${JSON.stringify(validFeedback)}`);

    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.rejectionReason).toBe("invalid_json");
  });

  it("does not repair schema-invalid feedback", () => {
    const parsed = parseManualFeedbackJson(JSON.stringify({ scores: validFeedback.scores }));

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const validated = validateFeedback(parsed.data);
      expect(validated.success).toBe(false);
      if (!validated.success) expect(validated.rejectionReason).toBe("feedback_lacks_retry_drill");
    }
  });
});
