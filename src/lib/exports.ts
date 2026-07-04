import type { LessonPackV1, SourceMode } from "@/src/lib/contracts";

export type LessonGenerationExportSource = {
  id: number;
  prompt: string;
  rawAiOutput: string;
  validatedJson: LessonPackV1;
  sourceMode: SourceMode;
  rejectionReason: string | null;
  createdAt: Date;
};

export type DatasetExportKind =
  | "lesson_generation_sft"
  | "feedback_scoring_sft"
  | "error_classification"
  | "retry_generation_sft"
  | "json_repair_sft";

export function formatJsonl(rows: unknown[]): string {
  if (rows.length === 0) {
    return "";
  }

  return `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
}

export function buildLessonGenerationExportRows(
  rows: LessonGenerationExportSource[]
) {
  return rows.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    raw_response: row.rawAiOutput,
    accepted_normalized_json: row.validatedJson,
    source_mode: row.sourceMode,
    rejection_reason: row.rejectionReason,
    created_at: row.createdAt.toISOString()
  }));
}
