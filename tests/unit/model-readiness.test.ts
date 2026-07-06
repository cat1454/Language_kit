import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DATASET_MANIFEST_SCHEMA_VERSION,
  datasetManifestSchema
} from "@/src/lib/model-readiness";

type ManifestRecord = {
  schemaVersion: string;
  datasets: Array<Record<string, unknown>>;
};

const manifest = readJson("datasets/manifest.example.json") as ManifestRecord;

describe("model readiness manifest", () => {
  it("validates the checked-in example manifest", () => {
    const result = datasetManifestSchema.safeParse(manifest);

    expect(result.success).toBe(true);
    expect(manifest.schemaVersion).toBe(DATASET_MANIFEST_SCHEMA_VERSION);
  });

  it("rejects an unknown dataset kind", () => {
    const candidate = withFirstDataset({ kind: "unknown_dataset" });

    expect(datasetManifestSchema.safeParse(candidate).success).toBe(false);
  });

  it("rejects an unknown readiness status", () => {
    const candidate = withFirstDataset({ readinessStatus: "training_ready" });

    expect(datasetManifestSchema.safeParse(candidate).success).toBe(false);
  });

  it.each([
    ["containsPersonalData", true],
    ["containsUserId", true],
    ["containsAudioPath", true]
  ])("blocks training-review readiness when %s is unsafe", (flag, value) => {
    const candidate = withFirstPrivacy({ [flag]: value }, {
      readinessStatus: "ready_for_training_review"
    });

    expect(datasetManifestSchema.safeParse(candidate).success).toBe(false);
  });

  it.each(["noUserId", "noAudioPath"])(
    "requires the %s quality gate",
    (gate) => {
      const candidate = structuredClone(manifest);
      const qualityGates = candidate.datasets[0]?.qualityGates as Record<string, unknown>;
      delete qualityGates[gate];

      expect(datasetManifestSchema.safeParse(candidate).success).toBe(false);
    }
  );

  it("requires repair seeds to document raw response and rejection reason policy", () => {
    const candidate = structuredClone(manifest);
    const repairSeed = candidate.datasets.find(
      (dataset) => dataset.intendedUse === "repair_seed"
    );

    expect(repairSeed).toBeDefined();
    repairSeed!.requiredFields = ["raw_response"];
    repairSeed!.policyRefs = [];

    expect(datasetManifestSchema.safeParse(candidate).success).toBe(false);
  });
});

describe("model readiness documentation gates", () => {
  it("provides the required model card fields", () => {
    const modelCard = readText("docs/model-card-template.md");

    for (const heading of [
      "## Model identity",
      "## Intended use",
      "## Training data",
      "## Evaluation",
      "## Privacy, licensing, and sources",
      "## Safety and limitations",
      "## Runtime and hardware estimate",
      "## Rollback plan",
      "## Human approval"
    ]) {
      expect(modelCard).toContain(heading);
    }
  });

  it("states Prompt 11 performs no training or fine-tuning", () => {
    const runbook = readText("docs/fine-tune-readiness-runbook.md");

    expect(runbook).toContain("No model was trained");
    expect(runbook).toContain("No model was fine-tuned");
    expect(runbook).toContain("manual review is required before any training run");
  });

  it("keeps eval gates connected to the existing deterministic checks", () => {
    const evalGates = readText("docs/eval-gates-v1.md");

    expect(evalGates).toContain("corepack pnpm eval:v0");
    expect(evalGates).toContain("corepack pnpm dogfood:check");
  });

  it("exposes the focused readiness command", () => {
    const packageJson = readJson("package.json") as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["model:readiness"]).toBe(
      "vitest run tests/unit/model-readiness.test.ts"
    );
  });
});

function withFirstDataset(overrides: Record<string, unknown>) {
  const candidate = structuredClone(manifest);
  candidate.datasets[0] = { ...candidate.datasets[0], ...overrides };
  return candidate;
}

function withFirstPrivacy(
  privacyOverrides: Record<string, unknown>,
  datasetOverrides: Record<string, unknown>
) {
  const candidate = withFirstDataset(datasetOverrides);
  const privacy = candidate.datasets[0]?.privacy as Record<string, unknown>;
  candidate.datasets[0]!.privacy = { ...privacy, ...privacyOverrides };
  return candidate;
}

function readJson(relativePath: string): unknown {
  return JSON.parse(readText(relativePath)) as unknown;
}

function readText(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
