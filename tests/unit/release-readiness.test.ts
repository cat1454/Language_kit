import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const requiredFiles = [
  "README.md",
  ".env.example",
  "scripts/backup-db.sh",
  "docs/backup-restore.md",
  "docs/json-export-standard.md",
  "docs/eval-v0.md",
  "docs/eval-gates-v1.md",
  "docs/model-readiness-v1.md",
  "docs/local-stt-prototype.md",
  "docs/dogfood-plan.md",
  "docs/dogfood-runbook.md",
  "docs/release-readiness.md",
  "docs/security-privacy-review.md",
  "docs/operational-runbook.md",
  "current-stage.md"
] as const;

const requiredScripts = [
  "check",
  "test:coverage",
  "test:all",
  "build",
  "eval:v0",
  "dogfood:check",
  "model:readiness",
  "release:check"
] as const;

describe("release readiness", () => {
  it("keeps every required release artifact in the repository", () => {
    for (const file of requiredFiles) {
      expect(existsSync(resolve(file)), file).toBe(true);
    }
  });

  it("exposes the focused and full release gate commands", () => {
    const packageJson = JSON.parse(readText("package.json")) as {
      scripts?: Record<string, string>;
    };

    for (const script of requiredScripts) {
      expect(packageJson.scripts?.[script], script).toBeTruthy();
    }
    expect(packageJson.scripts?.["release:check"]).toBe(
      "vitest run tests/unit/release-readiness.test.ts"
    );
  });

  it("documents fresh local setup, database, tests, backup, and manual relay", () => {
    const readme = readText("README.md").toLowerCase();

    for (const expected of [
      "node.js 22",
      "copy-item .env.example .env",
      "pnpm db:migrate",
      "pnpm test:all",
      "pnpm test:e2e",
      "scripts/backup-db.sh",
      "pnpm eval:v0",
      "pnpm model:readiness",
      "manual ai relay",
      "known limitations",
      "safety and privacy"
    ]) {
      expect(readme, expected).toContain(expected);
    }
  });

  it("keeps the environment example secret-free and local STT disabled", () => {
    const environment = readText(".env.example");

    expect(environment).toContain("DATABASE_URL=");
    expect(environment).toContain("LANGUAGE_KIT_LOCAL_STT_ENABLED=0");
    expect(environment).toMatch(/LANGUAGE_KIT_LOCAL_STT_COMMAND=\s*(?:\r?\n|$)/);
    expect(findSecretLikeValues(environment)).toEqual([]);
  });

  it("finds no obvious committed credential values in docs", () => {
    const findings = markdownFiles("docs").flatMap((file) =>
      findSecretLikeValues(readText(file)).map((match) => `${file}: ${match}`)
    );

    expect(findings).toEqual([]);
  });

  it("keeps local STT explicitly disabled and disconnected", () => {
    const localStt = readText("docs/local-stt-prototype.md").toLowerCase();

    expect(localStt).toContain("disabled by default");
    expect(localStt).toContain("not connected to the learner ui or any api route");
    expect(localStt).toContain("no model is bundled, installed, or downloaded");
  });

  it("states the release does not include production-only capabilities", () => {
    const release = readText("docs/release-readiness.md").toLowerCase();

    for (const boundary of [
      "no production authentication",
      "no cloud deployment",
      "no production model serving",
      "no production stt",
      "no fine-tuning"
    ]) {
      expect(release, boundary).toContain(boundary);
    }
  });

  it("connects operations to migrations, backup, restore, and smoke checks", () => {
    const runbook = readText("docs/operational-runbook.md").toLowerCase();

    expect(runbook).toContain("corepack pnpm db:migrate");
    expect(runbook).toContain("scripts/backup-db.sh");
    expect(runbook).toContain("pg_restore");
    expect(runbook).toContain("disposable");
    expect(runbook).toContain("post-release smoke");
  });

  it("documents the user, audio, export, model-output, and dogfood boundaries", () => {
    const review = readText("docs/security-privacy-review.md").toLowerCase();

    for (const boundary of [
      "user_id",
      "audio path",
      "speaking audio",
      "raw model output",
      "exports",
      "dogfood",
      "local stt"
    ]) {
      expect(review, boundary).toContain(boundary);
    }
  });

  it("marks Prompt 12 as the current completed stage", () => {
    const stage = readText("current-stage.md");

    expect(stage).toContain("M12_PRODUCT_HARDENING_RELEASE_READINESS");
    expect(stage).toContain("Prompt 12 - Product hardening / release readiness: complete locally.");
  });
});

function resolve(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}

function readText(relativePath: string): string {
  return readFileSync(resolve(relativePath), "utf8");
}

function markdownFiles(relativeDirectory: string): string[] {
  return readdirSync(resolve(relativeDirectory), { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join(relativeDirectory, file));
}

function findSecretLikeValues(content: string): string[] {
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    /\bAKIA[0-9A-Z]{16}\b/g,
    /\bghp_[A-Za-z0-9]{20,}\b/g,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
    /\bsk-[A-Za-z0-9]{20,}\b/g
  ];

  return patterns.flatMap((pattern) => content.match(pattern) ?? []);
}
