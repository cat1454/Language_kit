# Current Stage - Language Kit

Audit/update date: 2026-07-05
Branch: `feat/speaking-stt-foundation`

## Stage ID

`M9_SPEAKING_STT_FOUNDATION`

## Current Milestone Status

Prompt 9 - Speaking/STT foundation: complete locally.

Prompt 8 was checkpoint committed before Prompt 9 began. Preflight was clean
on `feat/speaking-stt-foundation`, with Prompt 8 commit
`909a6f6 Complete Listening v2 interaction`.

Prompt 9 adds optional, privacy-first speaking practice and manual transcript
persistence. It does not add pronunciation scoring, fluency scoring, realtime
voice roleplay, a paid STT provider, production local model execution,
fine-tuning, cloud audio upload, or third-party website automation.

- Milestone 1, Prompt Builder And Schema Validation: complete.
- Milestone 2, Lesson Display And Storage: complete at MVP scope.
- Milestone 3, Listening Checks And Logs: complete at MVP scope.
- Milestone 4, Persistence, Feedback, Retry, Export, And Data Safety: complete.
- Milestone 5, Listening v1 foundation: complete.
- Milestone 6, Dataset Export: covered by eval v0.
- Milestone 7, Dogfood + Eval Set v0: complete.
- Milestone 7.5, First Dogfood Run + Eval Calibration: complete.
- Milestone 8, Listening v2 Interaction: complete.
- Milestone 9, Speaking/STT Foundation: complete locally.

## What Is Done

- Added `speaking_attempts` storage with generated Drizzle migration
  `0003_bored_white_tiger.sql`.
- Preserved `lesson_pack.v1` and the existing feedback contract unchanged.
- Added a small transcription boundary with manual and deterministic mock
  adapters plus reserved `future_local` vocabulary.
- Added `POST /api/speaking-attempts` with strict Zod validation, missing-lesson
  handling, generic persistence errors, and a compact learner-safe response.
- Added optional speaking practice after the text roleplay panel.
- Kept manual transcript entry available in every browser.
- Added explicit start/stop recording only when `MediaRecorder` is available.
- Kept recorded audio in a page-session Blob URL only; no upload, database blob,
  file write, or `audio_path` persistence occurs.
- Stopped microphone tracks after recording and when the panel unmounts.
- Added browser-only demo transcript persistence without changing the demo
  lesson contract.
- Added privacy, adapter, data model, migration, API, repository, and E2E tests.
- Added `docs/speaking-stt-foundation.md` and updated the data-model and
  infrastructure-debt documents.

## Privacy And Permission Decisions

- Microphone permission is never requested on page load.
- Recording begins only after an explicit learner click.
- Denied or unsupported recording never blocks manual transcript entry.
- Audio remains local to the current page session and is never uploaded.
- The learner receives no pronunciation, fluency, speaking-quality, or
  assessment score.
- No paid, cloud, local-production, or third-party STT execution exists.
- Persisted transcript responses exclude the single-user `user_id` placeholder.

## Data And Contract Impact

- `lesson_pack.v1`: unchanged.
- `feedback.v1` and manual feedback validation: unchanged.
- Database: additive `speaking_attempts` table with nullable audio path,
  transcript, provider, and updated timestamp fields.
- Lesson detail payload: unchanged.
- Dashboard payload: unchanged.
- Exports: unchanged.
- Eval set: unchanged.
- Learner-facing `user_id`: still excluded.

## Migration Evidence

A disposable PostgreSQL database was created with migrations `0000`, `0001`,
and `0002`. An existing lesson and listening input with a legacy audio path were
inserted before migration `0003`. After applying `0003`, the existing
`lesson_pack.v1` row retained its audio path and null Listening v2 metadata.
The new `speaking_attempts` table accepted a manual transcript without an
explicit `user_id` and persisted the default value `1`.

The unified opt-in repository suite then passed all 8 tests against the
disposable database, including existing lesson loading and speaking-attempt
persistence. The disposable database was removed afterward.

The local development database was migrated successfully with `corepack pnpm
db:migrate` before the E2E regression run.

## What Is Missing

- Automatic speech-to-text transcription.
- A local faster-whisper prototype or production model runtime.
- Persisted audio files, retention rules, or learner-facing audio deletion.
- Pronunciation or fluency assessment.
- Realtime voice roleplay.
- Fine-tuning or training data changes.

## In Scope For The Next Stage

Recommended next implementation stage: Prompt 9.5 - Local STT prototype spike.

That spike must separately decide model installation, device requirements,
process isolation, consent, audio/transcript retention, deletion, failure
handling, and the exact boundary that guarantees audio remains local. Prompt 9
does not pre-authorize production local inference or any cloud provider.

## Acceptance Checklist For Prompt 9

- [x] Prompt 8 checkpoint commit verified.
- [x] Prompt 9 started from a clean `feat/speaking-stt-foundation` branch.
- [x] Optional speaking-attempt storage and migration added.
- [x] Existing lessons and Listening v2 behavior remain compatible.
- [x] Manual transcript adapter and deterministic mock boundary added.
- [x] API rejects invalid payloads with 400.
- [x] API returns 404 for a missing lesson.
- [x] API and lesson/dashboard payloads do not expose `user_id`.
- [x] Microphone permission is not requested on page load.
- [x] Recording is explicit, optional, and local to the page session.
- [x] Manual transcript entry remains available without recording support.
- [x] Audio is not uploaded or persisted.
- [x] `lesson_pack.v1`, feedback, exports, and eval contracts remain unchanged.
- [x] No scoring, realtime voice roleplay, provider integration, or fine-tuning.

## Verification Run

```text
corepack pnpm check
Result: passed. File-size and TypeScript checks passed. 19 test files passed,
1 skipped. 102 tests passed, 8 PostgreSQL tests skipped by default.

corepack pnpm test:coverage
Result: passed. Statements 96.8%, branches 91.09%, functions 98.64%,
lines 97.81%.

corepack pnpm test:all
Result: passed with the same test and coverage results.

corepack pnpm build
Result: passed. Next.js production build compiled, typed, generated pages, and
included /api/speaking-attempts.

corepack pnpm vitest run tests/integration/learning-routes.test.ts
Result: passed. 1 file, 13 tests.

corepack pnpm vitest run tests/integration/lesson-detail-safety-routes.test.ts
Result: passed. 1 file, 4 tests.

corepack pnpm vitest run tests/integration/repository-postgres.test.ts
Default result: skipped as designed. 1 file, 8 PostgreSQL tests skipped.

RUN_DB_TESTS=1 DATABASE_URL=<disposable>
corepack pnpm vitest run tests/integration/repository-postgres.test.ts
Result: passed. 1 file, 8 tests.

corepack pnpm db:migrate
Result: passed. Migration 0003 applied to the local development database.

corepack pnpm playwright test tests/e2e/listening-v2.spec.ts --workers=1
Result: passed. 5 tests.

corepack pnpm playwright test tests/e2e/mvp-flow.spec.ts --workers=1
Result: passed. 5 tests.

corepack pnpm playwright test tests/e2e/mvp-hardening.spec.ts --workers=1
Result: passed. 3 tests.

corepack pnpm playwright test tests/e2e/speaking-stt-foundation.spec.ts --workers=1
Result: passed. 3 tests.

corepack pnpm test:e2e
Result: passed. 18 tests.

corepack pnpm eval:v0
Result: passed. 1 file, 3 tests.

corepack pnpm dogfood:check
Result: passed. Real dogfood log found and eval v0 passed.

Security review
Result: passed for Prompt 9 scope. Permission is click-initiated, audio is not
uploaded, request input is strict and validated, responses are explicitly
projected, and no dependency/provider integration was added.

git diff --check
Result: passed with CRLF warnings only.
```

## Last Update Notes

- Prompt 9 is complete locally and verified.
- TDD RED and GREEN checkpoint commits were created on the active branch.
- No push was made.
- Prompt 9.5 remains separate and out of scope.
