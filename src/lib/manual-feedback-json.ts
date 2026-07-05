import type { ValidationResult } from "@/src/lib/contracts";

export function parseManualFeedbackJson(raw: string): ValidationResult<unknown> {
  const candidate = stripWholeCodeFence(raw.trim());

  try {
    return {
      success: true,
      data: JSON.parse(candidate),
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

function stripWholeCodeFence(value: string) {
  const fence = value.match(/^(`{3,})(?:json)?\s*([\s\S]*?)\s*\1$/i);
  return fence ? fence[2].trim() : value;
}
