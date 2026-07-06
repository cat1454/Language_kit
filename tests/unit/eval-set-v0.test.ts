import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validFeedback, validLessonPack } from "@/src/demo/lesson-pack-fixture";
import {
  type FeedbackV1,
  type LessonPackV1,
  type RejectionReason,
  parseAiJson,
  validateFeedback,
  validateLessonPack
} from "@/src/lib/contracts";
import {
  buildFeedbackScoringExportRows,
  buildJsonRepairExportRows,
  buildLessonGenerationExportRows,
  formatJsonl
} from "@/src/lib/exports";
import { parseManualFeedbackJson } from "@/src/lib/manual-feedback-json";

type EvalTaskType =
  | "lesson_generation_contract"
  | "feedback_contract"
  | "json_repair_seed"
  | "export_jsonl_shape";
type EvalSource = "fixture" | "manual_seed" | "export_builder";
type EvalInput = {
  fixture?: "validLessonPack" | "validFeedback";
  mutation?: string;
  raw?: string;
  repairTarget?: "lesson_pack.v1" | "feedback.v1";
  exportFixture?: string;
};
type EvalRow = {
  id: string;
  task_type: EvalTaskType;
  input: EvalInput;
  expected: { accepted: boolean; rejectionReason?: RejectionReason };
  checks: string[];
  source: EvalSource;
  notes: string;
};

const REQUIRED_IDS = `
lesson_valid_default lesson_invalid_json lesson_wrong_schema_version lesson_too_few_chunks
lesson_transcript_leak_risk lesson_duration_too_short lesson_missing_roleplay lesson_extra_top_level_key
feedback_valid_default feedback_valid_markdown_fence_manual_parser feedback_invalid_json feedback_missing_retry_drill
feedback_bad_error_type feedback_bad_retry_priority feedback_missing_evidence feedback_extra_top_level_key
repair_seed_lesson_invalid_json repair_seed_lesson_wrong_schema repair_seed_feedback_missing_retry repair_seed_prose_wrapped_feedback
export_lesson_generation_accepted export_feedback_scoring_accepted export_feedback_scoring_rejected export_json_repair_rejected
`.trim().split(/\s+/);
const TASK_TYPES = new Set<EvalTaskType>(["lesson_generation_contract", "feedback_contract", "json_repair_seed", "export_jsonl_shape"]);
const SOURCES = new Set<EvalSource>(["fixture", "manual_seed", "export_builder"]);
const FIXTURES = new Set(["validLessonPack", "validFeedback"]);
const CHECKS = new Set(["parse_ai_json", "validate_lesson_pack", "parse_manual_feedback_json", "validate_feedback", "repair_seed", "export_jsonl_shape"]);
const MUTATIONS = new Set(["none", "wrong_schema_version", "too_few_chunks", "transcript_leak_risk", "duration_too_short", "missing_roleplay", "extra_top_level_key", "whole_markdown_fence", "missing_retry_drill", "bad_error_type", "bad_retry_priority", "missing_evidence", "prose_wrapped"]);
const EXPORT_FIXTURES = new Set(["lesson_generation_accepted", "feedback_scoring_accepted", "feedback_scoring_rejected", "json_repair_rejected"]);
const ROW_KEYS = ["checks", "expected", "id", "input", "notes", "source", "task_type"];
const NOW = new Date("2026-07-05T00:00:00.000Z");
const rows = loadRows();

describe("eval_set_v0", () => {
  it("contains the required 24 JSONL rows", () => {
    expect(rows).toHaveLength(24);
    expect(rows.map((row) => row.id)).toEqual([...REQUIRED_IDS]);
  });

  it("uses only known eval vocabulary", () => {
    for (const row of rows) validateDefinition(row);

    expect(() => validateDefinition({ ...rows[0], task_type: "unknown" } as unknown as EvalRow))
      .toThrow("unknown task_type");
    expect(() => validateDefinition({ ...rows[0], checks: ["unknown"] }))
      .toThrow("unknown check");
    expect(() => validateDefinition({
      ...rows[0],
      input: { fixture: "unknown", mutation: "none" }
    } as unknown as EvalRow)).toThrow("unknown fixture");
    expect(() => validateDefinition({
      ...rows[0],
      input: { fixture: "validLessonPack", mutation: "unknown" }
    })).toThrow("unknown mutation");
  });

  it("runs deterministic contract and export checks", () => {
    for (const row of rows) runRow(row);
  });
});

function loadRows() {
  const file = path.join(process.cwd(), "eval", "eval_set_v0.jsonl");
  const content = readFileSync(file, "utf8");
  const lines = content.trimEnd().split("\n");

  return lines.map((line) => JSON.parse(line) as EvalRow);
}

function validateDefinition(row: EvalRow) {
  if (JSON.stringify(Object.keys(row).sort()) !== JSON.stringify(ROW_KEYS)) {
    throw new Error(`invalid row shape: ${row.id}`);
  }
  if (!TASK_TYPES.has(row.task_type)) throw new Error(`unknown task_type: ${row.task_type}`);
  if (!SOURCES.has(row.source)) throw new Error(`unknown source: ${row.source}`);
  for (const check of row.checks) {
    if (!CHECKS.has(check)) throw new Error(`unknown check: ${check}`);
  }
  if (row.input.fixture && !FIXTURES.has(row.input.fixture)) {
    throw new Error(`unknown fixture: ${row.input.fixture}`);
  }
  if (row.input.mutation && !MUTATIONS.has(row.input.mutation)) {
    throw new Error(`unknown mutation: ${row.input.mutation}`);
  }
  if (row.input.exportFixture && !EXPORT_FIXTURES.has(row.input.exportFixture)) {
    throw new Error(`unknown export fixture: ${row.input.exportFixture}`);
  }
  if (!row.expected.accepted && !row.expected.rejectionReason) {
    throw new Error(`missing rejection reason: ${row.id}`);
  }
}

function runRow(row: EvalRow) {
  if (row.task_type === "lesson_generation_contract") runLessonRow(row);
  if (row.task_type === "feedback_contract") runFeedbackRow(row);
  if (row.task_type === "json_repair_seed") runRepairSeedRow(row);
  if (row.task_type === "export_jsonl_shape") runExportRow(row);
}

function runLessonRow(row: EvalRow) {
  const parsed = parseAiJson(toLessonRaw(row.input));
  if (!parsed.success) return assertOutcome(row, false, parsed.rejectionReason);

  const validated = validateLessonPack(parsed.data);
  assertOutcome(row, validated.success, validated.success ? null : validated.rejectionReason);
}

function runFeedbackRow(row: EvalRow) {
  const parsed = parseManualFeedbackJson(toFeedbackRaw(row.input));
  if (!parsed.success) return assertOutcome(row, false, parsed.rejectionReason);

  const validated = validateFeedback(parsed.data);
  assertOutcome(row, validated.success, validated.success ? null : validated.rejectionReason);
}

function runRepairSeedRow(row: EvalRow) {
  if (row.input.repairTarget === "lesson_pack.v1") return runLessonRow(row);
  runFeedbackRow(row);
}

function runExportRow(row: EvalRow) {
  const exportRows = buildExportRows(row.input.exportFixture ?? "");
  const parsedRows = formatJsonl(exportRows).trimEnd().split("\n").map((line) => JSON.parse(line));
  const first = parsedRows[0] as Record<string, unknown>;

  expect(parsedRows).toEqual(exportRows);
  expect(first.accepted).toBe(row.expected.accepted);
  if (row.expected.rejectionReason) {
    expect(first.rejection_reason).toBe(row.expected.rejectionReason);
  }
  expect(first.raw_response ?? first.broken_response).toBeTruthy();
  expect("source_mode" in first).toBe(true);
}

function assertOutcome(row: EvalRow, accepted: boolean, rejectionReason: RejectionReason | null) {
  expect(accepted, row.id).toBe(row.expected.accepted);
  if (!accepted) expect(rejectionReason, row.id).toBe(row.expected.rejectionReason);
}

function toLessonRaw(input: EvalInput) {
  return input.raw ?? JSON.stringify(mutateLesson(input.mutation ?? "none"));
}

function toFeedbackRaw(input: EvalInput) {
  if (input.raw) return input.raw;
  const value = JSON.stringify(mutateFeedback(input.mutation ?? "none"));

  return input.mutation === "whole_markdown_fence"
    ? `\`\`\`json\n${value}\n\`\`\``
    : input.mutation === "prose_wrapped"
      ? `Here is the object:\n${value}`
      : value;
}

function mutateLesson(mutation: string): unknown {
  const lesson = clone(validLessonPack) as Record<string, unknown>;
  if (mutation === "wrong_schema_version") lesson.schema_version = "lesson_pack.v0";
  if (mutation === "duration_too_short") {
    (lesson.listening_input as Record<string, unknown>).duration_seconds = 20;
  }
  if (mutation === "transcript_leak_risk") {
    (lesson.quality_checks as Record<string, unknown>).no_answer_leak_before_listening = false;
  }
  if (mutation === "too_few_chunks") {
    (lesson.post_listening as { chunks: unknown[] }).chunks =
      validLessonPack.post_listening.chunks.slice(0, 2);
  }
  if (mutation === "missing_roleplay") delete lesson.roleplay;
  if (mutation === "extra_top_level_key") lesson.extra_top_level_key = true;

  return lesson;
}

function mutateFeedback(mutation: string): unknown {
  const feedback = clone(validFeedback) as Record<string, unknown>;
  const firstError = ((feedback.error_log_items as Array<Record<string, unknown>>)[0] ?? {});

  if (mutation === "missing_retry_drill") delete feedback.retry_drill;
  if (mutation === "bad_error_type") firstError.type = "fluency";
  if (mutation === "bad_retry_priority") firstError.retry_priority = "urgent";
  if (mutation === "missing_evidence") delete firstError.evidence;
  if (mutation === "extra_top_level_key") feedback.extra_top_level_key = true;

  return feedback;
}

function buildExportRows(exportFixture: string) {
  if (exportFixture === "lesson_generation_accepted") {
    return buildLessonGenerationExportRows([{
      id: 1,
      prompt: "Generate lesson_pack.v1",
      rawAiOutput: JSON.stringify(validLessonPack),
      validatedJson: validLessonPack,
      sourceMode: "manual_free_relay",
      rejectionReason: null,
      createdAt: NOW
    }]);
  }

  const rejectedFeedback = { scores: validFeedback.scores };
  const feedbackSource = {
    taskType: "feedback_scoring" as const,
    prompt: "Evaluate feedback.v1",
    rawResponse: JSON.stringify(validFeedback),
    parsedJson: validFeedback,
    accepted: true,
    rejectionReason: null,
    sourceMode: "manual_free_relay" as const,
    providerOrSite: "manual",
    modelName: "unknown",
    createdAt: NOW
  };

  if (exportFixture === "feedback_scoring_accepted") {
    return buildFeedbackScoringExportRows([feedbackSource]);
  }
  if (exportFixture === "feedback_scoring_rejected") {
    return buildFeedbackScoringExportRows([{
      ...feedbackSource,
      rawResponse: JSON.stringify(rejectedFeedback),
      parsedJson: rejectedFeedback,
      accepted: false,
      rejectionReason: "feedback_lacks_retry_drill"
    }]);
  }

  return buildJsonRepairExportRows([{
    taskType: "lesson_generation",
    prompt: "Generate lesson_pack.v1",
    rawResponse: "{ bad json",
    parsedJson: null,
    accepted: false,
    rejectionReason: "invalid_json",
    sourceMode: "manual_free_relay",
    providerOrSite: "manual",
    modelName: "unknown",
    createdAt: NOW
  }]);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
