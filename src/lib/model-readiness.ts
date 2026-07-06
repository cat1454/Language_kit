import { z } from "zod";
import type { DatasetExportKind } from "@/src/lib/exports";

export const DATASET_MANIFEST_SCHEMA_VERSION =
  "language-kit.dataset_manifest.v1" as const;

export const exportDatasetKinds = [
  "lesson_generation_sft",
  "feedback_scoring_sft",
  "error_classification",
  "retry_generation_sft",
  "json_repair_sft"
] as const satisfies readonly DatasetExportKind[];

export const datasetKinds = [
  ...exportDatasetKinds,
  "eval_set_v0",
  "dogfood_sessions"
] as const;

export const intendedUses = [
  "sft_candidate",
  "eval_candidate",
  "diagnostic_only",
  "repair_seed"
] as const;

export const readinessStatuses = [
  "blocked",
  "needs_review",
  "ready_for_eval",
  "ready_for_training_review"
] as const;

export const datasetKindSchema = z.enum(datasetKinds);
export const intendedUseSchema = z.enum(intendedUses);
export const readinessStatusSchema = z.enum(readinessStatuses);

export const privacyFlagsSchema = z
  .object({
    containsPersonalData: z.boolean(),
    containsAudioPath: z.boolean(),
    containsUserId: z.boolean(),
    requiresManualReview: z.boolean()
  })
  .strict();

export const qualityGatesSchema = z
  .object({
    validJsonl: z.boolean(),
    contractValidated: z.boolean(),
    acceptedOnlyWhenRequired: z.boolean(),
    rejectedRowsHaveReason: z.boolean(),
    noUserId: z.boolean(),
    noAudioPath: z.boolean(),
    noSecrets: z.boolean(),
    sourceDocumented: z.boolean()
  })
  .strict();

const nonEmptyString = z.string().trim().min(1);

export const datasetManifestEntrySchema = z
  .object({
    kind: datasetKindSchema,
    intendedUse: intendedUseSchema,
    readinessStatus: readinessStatusSchema,
    source: nonEmptyString,
    contractRefs: z.array(nonEmptyString),
    requiredFields: z.array(nonEmptyString),
    policyRefs: z.array(nonEmptyString),
    privacy: privacyFlagsSchema,
    qualityGates: qualityGatesSchema
  })
  .strict()
  .superRefine((dataset, context) => {
    if (dataset.intendedUse === "repair_seed") {
      for (const field of ["raw_response", "rejection_reason"]) {
        if (!dataset.requiredFields.includes(field)) {
          context.addIssue({
            code: "custom",
            message: `repair_seed requires ${field}`,
            path: ["requiredFields"]
          });
        }
      }

      if (!dataset.policyRefs.includes("docs/json-export-standard.md")) {
        context.addIssue({
          code: "custom",
          message: "repair_seed requires the JSON export rejection policy",
          path: ["policyRefs"]
        });
      }
    }

    if (dataset.readinessStatus !== "ready_for_training_review") return;

    const unsafePrivacy =
      dataset.privacy.containsPersonalData ||
      dataset.privacy.containsAudioPath ||
      dataset.privacy.containsUserId;
    if (unsafePrivacy) {
      context.addIssue({
        code: "custom",
        message: "training review requires privacy-safe data",
        path: ["privacy"]
      });
    }

    if (!dataset.privacy.requiresManualReview) {
      context.addIssue({
        code: "custom",
        message: "training review must preserve the manual review gate",
        path: ["privacy", "requiresManualReview"]
      });
    }

    for (const gate of [
      "validJsonl",
      "contractValidated",
      "noUserId",
      "noAudioPath",
      "noSecrets",
      "sourceDocumented"
    ] as const) {
      if (!dataset.qualityGates[gate]) {
        context.addIssue({
          code: "custom",
          message: `training review requires ${gate}`,
          path: ["qualityGates", gate]
        });
      }
    }

    if (
      dataset.intendedUse === "sft_candidate" &&
      !dataset.qualityGates.acceptedOnlyWhenRequired
    ) {
      context.addIssue({
        code: "custom",
        message: "SFT candidates must satisfy accepted-row policy",
        path: ["qualityGates", "acceptedOnlyWhenRequired"]
      });
    }

    if (
      dataset.intendedUse === "repair_seed" &&
      !dataset.qualityGates.rejectedRowsHaveReason
    ) {
      context.addIssue({
        code: "custom",
        message: "repair seeds require rejection reasons",
        path: ["qualityGates", "rejectedRowsHaveReason"]
      });
    }
  });

export const datasetManifestSchema = z
  .object({
    schemaVersion: z.literal(DATASET_MANIFEST_SCHEMA_VERSION),
    project: z.literal("Language Kit"),
    createdFor: z.literal("readiness"),
    datasets: z.array(datasetManifestEntrySchema).min(1)
  })
  .strict();

export type DatasetKind = z.infer<typeof datasetKindSchema>;
export type IntendedUse = z.infer<typeof intendedUseSchema>;
export type ReadinessStatus = z.infer<typeof readinessStatusSchema>;
export type DatasetManifest = z.infer<typeof datasetManifestSchema>;
