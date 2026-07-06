# Current Stage - Language Kit

Audit/update date: 2026-07-06
Branch: `chore/model-readiness-v1`

## Stage ID

`M11_LOCAL_MODEL_EVAL_FINE_TUNE_READINESS`

## Current Milestone Status

Prompt 11 - Local model/eval/fine-tune readiness: complete locally.

Prompt 10 was committed before Prompt 11 began. Preflight found a clean
worktree on `chore/model-readiness-v1` at `c7086840 Fix adaptive review stage
note`. Prompt 10 completion evidence remains reachable through `71932b4d`,
`7ace972b`, and `79a20320`.

Prompt 11 adds deterministic readiness definitions, a safe example dataset
manifest, privacy and quality gates, a model-card template, and review runbooks.
It does not train, fine-tune, serve, download, or integrate a model.

- Milestones 1-10: complete at their documented local scope.
- Milestone 11, Local Model/Eval/Fine-Tune Readiness: complete locally.

## Source Inspection

Existing export kinds:

- `lesson_generation_sft`
- `feedback_scoring_sft`
- `error_classification`
- `retry_generation_sft`
- `json_repair_sft`

Readiness findings:

- Lesson generation rows are accepted-only and retain prompt, raw response,
  validated `lesson_pack.v1`, source mode, and acceptance metadata.
- Feedback rows retain accepted/rejected status, raw response, parsed JSON,
  rejection reason, and source metadata. Accepted and rejected rows must be
  separated before any future training proposal.
- Error-classification and retry-generation rows are useful supervised-data
  candidates but do not include explicit accepted/rejected fields.
- JSON-repair rows retain `raw_response` and `rejection_reason`, but
  `repaired_json` remains `null`; they are repair seeds, not finished pairs.
- Export output shapes do not include `user_id` or audio paths.
- The checked-in dogfood log contains session metadata rather than raw model or
  learner payloads, but the directory may contain private learner evidence and
  is diagnostic-only. It must never be included automatically.

No export change was needed.

## What Is Done

- Added `src/lib/model-readiness.ts` with strict Zod vocabularies and manifest
  validation for dataset kinds, intended uses, readiness status, privacy flags,
  quality gates, repair-seed policy, and training-review safety.
- Added `datasets/manifest.example.json` covering five exports, eval v0, and
  dogfood sessions without including a generated dataset dump or private log.
- Added the `model:readiness` deterministic package command.
- Added model-readiness, fine-tune-readiness, model-card, and eval-gate docs.
- Added conservative placeholder thresholds and explicit privacy, source,
  license, split, leakage, rollback, hardware, safety, and human-review gates.
- Updated infrastructure debt for later production local-model work.

## Dataset Readiness Summary

| Dataset | Intended use | Status |
|---|---|---|
| `lesson_generation_sft` | SFT candidate | needs review |
| `feedback_scoring_sft` | SFT candidate | needs review |
| `error_classification` | SFT candidate | blocked |
| `retry_generation_sft` | SFT candidate | needs review |
| `json_repair_sft` | repair seed | blocked |
| `eval_set_v0` | eval candidate | ready for eval |
| `dogfood_sessions` | diagnostic only | blocked |

No dataset is approved for training. A `ready_for_training_review` status would
still require manual review and is rejected by the schema when personal data,
`user_id`, audio paths, or required safety gates are unsafe.

## Privacy And Safety Decisions

- `user_id` and audio paths remain excluded from export rows and manifest data.
- Free-form prompts, responses, feedback, and learner evidence are treated as
  potentially personal until manually reviewed.
- A false `noSecrets` gate means a manual scan remains outstanding; it does not
  claim a secret was found.
- Repair seeds require documented `raw_response` and `rejection_reason` policy.
- Raw dogfood logs are never automatic training input.
- No dataset was uploaded.
- All checks are deterministic and model-free.
- AI output remains untrusted until Zod validation passes.

## Data And Contract Impact

- `lesson_pack.v1`: unchanged.
- `feedback.v1` and manual feedback validation: unchanged.
- Database tables: unchanged.
- Migration: none.
- Learner-facing APIs: unchanged.
- Review queue payload: unchanged.
- Exports and export row shapes: unchanged.
- Eval set rows: unchanged.
- Listening, Speaking, local STT prototype, and Adaptive Review behavior:
  unchanged.
- Local STT prototype: separate and disabled by default.

## Model Readiness Boundary

- Model trained: no.
- Fine-tune run: no.
- Model served or integrated: no.
- Model weights downloaded: no.
- Provider integration added: no.
- Vector search added: no.
- Production local-model work requires a separate prompt.

## TDD Checkpoints

- RED: `ba1eccaa test: add model readiness red coverage`
  - the focused target failed because the readiness module did not exist
- GREEN: `6261fa7a feat: add deterministic model readiness gates`
  - the same focused target passed 13 tests

## Verification Run

```text
corepack pnpm vitest run tests/unit/model-readiness.test.ts
Result: passed. 1 file, 13 tests.

corepack pnpm vitest run tests/unit/exports.test.ts
Result: passed. 1 file, 8 tests.

corepack pnpm vitest run tests/unit/eval-set-v0.test.ts
Result: passed. 1 file, 3 tests.

corepack pnpm vitest run tests/unit/adaptive-review.test.ts
Result: passed. 1 file, 7 tests.

corepack pnpm vitest run tests/unit/local-stt-prototype.test.ts
Result: passed. 1 file, 15 tests.

corepack pnpm vitest run tests/integration/review-queue-routes.test.ts
Result: passed. 1 file, 7 tests.

corepack pnpm vitest run tests/integration/lesson-detail-safety-routes.test.ts
Result: passed. 1 file, 4 tests.

corepack pnpm vitest run tests/integration/speaking-attempt-routes.test.ts
Result: passed. 1 file, 4 tests.

corepack pnpm playwright test tests/e2e/adaptive-review.spec.ts --workers=1
Result: passed. 2 tests.

corepack pnpm playwright test tests/e2e/listening-v2.spec.ts --workers=1
Result: passed. 5 tests.

corepack pnpm playwright test tests/e2e/speaking-stt-foundation.spec.ts --workers=1
Result: passed. 3 tests.

corepack pnpm check
Result: passed. File-size and TypeScript checks passed. 24 test files passed,
1 skipped. 147 tests passed, 8 PostgreSQL tests skipped by default.

corepack pnpm test:coverage
Result: passed. Statements 90.19%, branches 84.61%, functions 92.74%,
lines 91.34%.

corepack pnpm test:all
Result: passed with the same check, test, and coverage results.

corepack pnpm build
Result: passed. Next.js production build compiled, typed, and generated pages.

corepack pnpm eval:v0
Result: passed. 1 file, 3 tests.

corepack pnpm dogfood:check
Result: passed. Real dogfood log found and eval v0 passed.

corepack pnpm model:readiness
Result: passed. 1 file, 13 tests.

git diff --check
Result: passed.
```

Security/privacy review passed for Prompt 11 scope: no secrets, identifiers, or
audio paths were added; unsafe candidate data cannot be marked ready for
training review; and no runtime, API, database, provider, or export behavior was
changed.

## Next Stage

Recommended next prompt: Prompt 12 - Product hardening / release readiness.

No push was made.
