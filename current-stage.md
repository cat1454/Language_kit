# Current Stage - Language Kit

Audit/update date: 2026-07-06
Branch: `spike/local-stt-prototype`

## Stage ID

`M9_5_LOCAL_STT_PROTOTYPE_SPIKE`

## Current Milestone Status

Prompt 9.5 - Local STT prototype spike: complete locally.

Prompt 9 was committed before Prompt 9.5 began. Preflight was clean on
`spike/local-stt-prototype`, with Prompt 9 completion commit
`7a1dac9 docs: complete speaking foundation verification`.

Prompt 9.5 adds a disabled-by-default server-side boundary for evaluating a
developer-managed local STT executable later. It is not connected to the
learner UI or an API route and does not bundle, download, install, or execute a
real model in tests.

- Milestone 1, Prompt Builder And Schema Validation: complete.
- Milestone 2, Lesson Display And Storage: complete at MVP scope.
- Milestone 3, Listening Checks And Logs: complete at MVP scope.
- Milestone 4, Persistence, Feedback, Retry, Export, And Data Safety: complete.
- Milestone 5, Listening v1 foundation: complete.
- Milestone 6, Dataset Export: covered by eval v0.
- Milestone 7, Dogfood + Eval Set v0: complete.
- Milestone 7.5, First Dogfood Run + Eval Calibration: complete.
- Milestone 8, Listening v2 Interaction: complete.
- Milestone 9, Speaking/STT Foundation: complete.
- Milestone 9.5, Local STT Prototype Spike: complete locally.

## What Is Done

- Added `src/lib/local-stt-prototype.ts` with explicit input/result types and
  stable safe error codes.
- Kept the boundary disabled unless `LANGUAGE_KIT_LOCAL_STT_ENABLED=1` and
  `LANGUAGE_KIT_LOCAL_STT_COMMAND` are both explicitly configured.
- Added a deterministic injected file inspector and process runner for tests.
- Added a real local runner using `spawn` with `shell: false` and argument
  arrays; no command-string interpolation is used.
- Added explicit consent, absolute local path, extension, regular-file, size,
  timeout, stdout-size, strict JSON, and non-empty transcript checks.
- Rejected relative paths, URLs, Windows network paths, unsupported audio
  types, files over 25 MiB, malformed output, timeout, and execution failure.
- Redacted command, stderr, thrown errors, and other process details from
  returned results.
- Added environment examples while keeping the feature disabled by default.
- Added `docs/local-stt-prototype.md` and updated the speaking and
  infrastructure-debt documentation.
- Preserved the Prompt 9 learner UI, manual transcript API, local page-session
  recording, and privacy behavior unchanged.

## Local Command Contract

```text
<command> <absolute-audio-path> [--language <value>] [--engine <value>]
```

The command must return one strict JSON object with `transcript` and optional
`language` and `durationMs`. Unknown fields and empty transcripts are rejected.

No `stt:local:probe` package script was added. Running the TypeScript module
directly from Node would require a new runtime transpiler or duplicate logic,
which is not justified for this spike.

## Privacy And Safety Decisions

- Local STT is disabled by default.
- No cloud or paid provider exists.
- No model is bundled or downloaded automatically.
- Tests use injected mocks and never require a real model.
- Audio paths must identify already-existing local files.
- The boundary performs no upload, network call, database write, or file write.
- Browser recordings remain page-session Blob URLs and are not passed to the
  prototype.
- Microphone permission behavior is unchanged and remains learner-initiated.
- Safe failures expose codes only, never configured command details.

## Data And Contract Impact

- `lesson_pack.v1`: unchanged.
- `feedback.v1` and manual feedback validation: unchanged.
- Database tables: unchanged.
- Migration: none.
- Lesson detail payload: unchanged.
- Speaking attempt payload and response: unchanged.
- Exports: unchanged.
- Eval set: unchanged.
- Learner-facing `user_id`: still excluded and regression verified.

## Production Decisions Still Required

- Local model and engine choice.
- Installation and runtime documentation.
- Supported device, CPU/GPU/RAM, and disk requirements.
- Audio and transcript retention/deletion policy.
- Learner-facing consent UX.
- Failure, recovery, and cancellation behavior.
- Process sandboxing and production security review.
- Representative latency and resource benchmarks.
- End-to-end privacy review.

## In Scope For The Next Stage

Recommended next implementation stage: Prompt 10 - Adaptive review v1.

Prompt 9.5 does not authorize production local STT, learner-facing automatic
transcription, persisted audio, or cloud integration.

## Acceptance Checklist For Prompt 9.5

- [x] Prompt 9 checkpoint commit verified.
- [x] Prompt 9.5 started from a clean `spike/local-stt-prototype` branch.
- [x] Prototype boundary exists and is disabled by default.
- [x] Local command requires explicit developer configuration.
- [x] Runner uses argument arrays and `shell: false`.
- [x] Consent and local audio path checks are enforced.
- [x] Timeout, malformed output, empty transcript, and execution failures are
  normalized to safe codes.
- [x] Command details and thrown errors are not exposed.
- [x] Tests use deterministic mocks and no real model.
- [x] Speaking manual transcript API and learner UI remain unchanged.
- [x] No upload, audio persistence, cloud provider, dependency, or migration.
- [x] No pronunciation/fluency scoring or realtime voice roleplay.
- [x] Remaining production decisions are documented.

## Verification Run

```text
corepack pnpm vitest run tests/unit/speaking-transcription.test.ts
Result: passed. 1 file, 3 tests.

corepack pnpm vitest run tests/unit/local-stt-prototype.test.ts
Result: passed. 1 file, 15 tests.

Requested path: tests/integration/speaking-attempts-routes.test.ts
Actual equivalent: tests/integration/speaking-attempt-routes.test.ts
corepack pnpm vitest run tests/integration/speaking-attempt-routes.test.ts
Result: passed. 1 file, 4 tests.

corepack pnpm vitest run tests/integration/lesson-detail-safety-routes.test.ts
Result: passed. 1 file, 4 tests.

corepack pnpm playwright test tests/e2e/speaking-stt-foundation.spec.ts --workers=1
Result: passed. 3 tests.

corepack pnpm check
Result: passed. File-size and TypeScript checks passed. 20 test files passed,
1 skipped. 117 tests passed, 8 PostgreSQL tests skipped by default.

corepack pnpm test:coverage
Result: passed. Statements 88.59%, branches 84.34%, functions 90%,
lines 89.42%.

corepack pnpm test:all
Result: passed with the same test and coverage results.

corepack pnpm build
Result: passed. Next.js production build compiled, typed, and generated routes.

corepack pnpm eval:v0
Result: passed. 1 file, 3 tests.

corepack pnpm dogfood:check
Result: passed. Real dogfood log found and eval v0 passed.

Security review
Result: passed for Prompt 9.5 scope. No network/upload/storage path, package,
UI, API, database, or migration change was added. The local runner uses
shell-disabled argument arrays and safe error projections.

git diff --check
Result: passed with CRLF warnings only.
```

## Last Update Notes

- Prompt 9.5 is complete locally and verified.
- TDD RED and GREEN checkpoint commits were created on the active branch.
- Final documentation checkpoint commit created on the active branch.
- No push was made.
- Prompt 10 remains separate and out of scope.
