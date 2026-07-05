import type { LessonPackV1, SourceMode, TaskType } from "@/src/lib/contracts";

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

export type ModelOutputExportSource = {
  taskType: TaskType;
  prompt: string;
  rawResponse: string;
  parsedJson: unknown | null;
  accepted: boolean;
  rejectionReason: string | null;
  sourceMode?: SourceMode | null;
  providerOrSite?: string | null;
  modelName?: string | null;
  createdAt: Date;
};

export type RetryGenerationExportSource = {
  instruction: string;
  items: string[];
  evidence: string | null;
  correction: string | null;
};

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

export function buildFeedbackScoringExportRows(rows: ModelOutputExportSource[]) {
  return rows.map((row) => {
    const base = {
      task_type: row.taskType,
      accepted: row.accepted,
      rejection_reason: row.rejectionReason,
      prompt: row.prompt,
      raw_response: row.rawResponse,
      parsed_json: row.parsedJson,
      source_mode: row.sourceMode ?? null,
      provider_or_site: row.providerOrSite ?? null,
      model_name: row.modelName ?? null,
      created_at: row.createdAt.toISOString()
    };

    return row.accepted
      ? { ...base, feedback_json: row.parsedJson }
      : base;
  });
}

export function buildRetryGenerationExportRows(
  rows: RetryGenerationExportSource[]
) {
  return rows
    .filter((row) => hasText(row.evidence) && hasText(row.correction))
    .map((row) => ({
      source_error: row.evidence,
      correction: row.correction,
      retry_drill: {
        instruction: row.instruction,
        items: row.items
      }
    }));
}

export function buildJsonRepairExportRows(rows: ModelOutputExportSource[]) {
  return rows
    .filter((row) => (
      !row.accepted &&
      hasText(row.rawResponse) &&
      hasText(row.rejectionReason)
    ))
    .map((row) => {
      const hasParsedJson = row.parsedJson !== null && row.parsedJson !== undefined;
      return {
        task_type: row.taskType,
        accepted: false,
        rejection_reason: row.rejectionReason,
        prompt: row.prompt,
        broken_response: row.rawResponse,
        has_parsed_json: hasParsedJson,
        ...(hasParsedJson ? { parsed_json: row.parsedJson } : {}),
        repaired_json: null,
        created_at: row.createdAt.toISOString()
      };
    });
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
