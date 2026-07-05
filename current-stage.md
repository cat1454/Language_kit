# Current Stage - Language Kit

Audit/update date: 2026-07-05
Branch: `feat/listening-v2-interaction`

## Stage ID

`M8_LISTENING_V2_INTERACTION`

## Current Milestone Status

Prompt 8 - Listening v2 interaction: complete locally.

Prompt 7.5 was checkpoint committed before Prompt 8 began. Preflight was clean
on `feat/listening-v2-interaction`, with Prompt 7.5 commit
`c763657 Complete first dogfood calibration`.

Listening v2 adds interaction around manually assigned/static audio. It does not
add TTS, STT/ASR, microphone recording, speaking assessment, AI provider calls,
local model calls, paid model calls, or third-party website automation.

- Milestone 1, Prompt Builder And Schema Validation: complete.
- Milestone 2, Lesson Display And Storage: complete at MVP scope.
- Milestone 3, Listening Checks And Logs: complete at MVP scope.
- Milestone 4, Persistence, Feedback, Retry, Export, And Data Safety: complete.
- Milestone 5, Listening v1 foundation: complete.
- Milestone 6, Dataset Export: covered by eval v0.
- Milestone 7, Dogfood + Eval Set v0: complete.
- Milestone 7.5, First Dogfood Run + Eval Calibration: complete.
- Milestone 8, Listening v2 Interaction: complete locally.

## What Is Done

- Added optional `listening_inputs.audio_metadata_json` storage with generated
  Drizzle migration `0002_overconfident_captain_america.sql`.
- Kept `lesson_pack.v1` unchanged; audio metadata remains app/storage metadata.
- Added strict metadata normalization for optional voice variants, chunk
  timings, default voice, and duration. Malformed metadata falls back to null.
- Added client-side speed control for `0.75x`, `1.0x`, and `1.25x`.
- Added optional voice selection backed only by manually supplied audio paths.
- Added timed chunk replay that seeks the HTML audio element and pauses at the
  configured end time.
- Added the safe missing-timing message:
  `Chunk replay needs timing metadata.`
- Added local-only dictation practice. Transcript comparison remains locked
  until the listening attempt is saved.
- Added shadowing controls without microphone, recording, STT, or scoring.
- Preserved the Listening v1 demo timer when no audio path or variant exists.
- Preserved transcript gating and the listening-first workflow order.
- Preserved M4 persistence/export behavior and learner-facing `user_id` safety.
- Added `docs/listening-v2.md` and updated the data-model field list.

## Data And Contract Impact

- `lesson_pack.v1`: unchanged.
- `feedback.v1` and manual feedback validation: unchanged.
- Database: nullable `listening_inputs.audio_metadata_json` added.
- Lesson detail payload: optional normalized `listeningInput.audioMetadata`
  added; malformed/missing metadata returns null.
- Exports: unchanged.
- Eval set: unchanged.
- Learner-facing `user_id`: still excluded.

## Migration Evidence

A disposable PostgreSQL database was created with migrations `0000` and `0001`.
An existing lesson with only `audio_path` was inserted before migration `0002`.
After applying `0002`, the row retained its audio path and returned null
metadata. The opt-in repository suite then passed all 7 tests against the
disposable database, including legacy and metadata-bearing detail loads. The
disposable database was removed afterward.

The local development database was also migrated with `corepack pnpm
db:migrate`. Before that migration, one `mvp-flow` test failed because the live
database lacked `audio_metadata_json`; after migration, the exact suite passed
5 of 5 tests.

## What Is Missing

- Manually prepared variant audio files and timing metadata for real lessons.
- Persistence for dictation drafts or shadowing activity.
- TTS/audio generation.
- STT/ASR and microphone recording.
- Speaking or pronunciation assessment.

## In Scope For The Next Stage

Next implementation stage: Prompt 9 - Speaking/STT integration.

Prompt 9 must be planned separately with explicit privacy, permission,
recording, transcription, provider, storage, and deletion decisions. Listening
v2 does not pre-authorize any microphone or model integration.

## Acceptance Checklist For Prompt 8

- [x] Prompt 7.5 checkpoint commit verified.
- [x] Prompt 8 started from a clean `feat/listening-v2-interaction` branch.
- [x] Optional audio metadata storage and migration added.
- [x] Existing audio-path-only lessons remain compatible.
- [x] Malformed metadata falls back safely.
- [x] Speed control uses HTML audio `playbackRate` only.
- [x] Voice variants use manually supplied audio paths only.
- [x] Chunk replay requires timing metadata.
- [x] Missing chunk timings show a non-blocking message.
- [x] Dictation transcript comparison remains gated.
- [x] Shadowing requests no microphone permission.
- [x] Missing-audio fallback remains available.
- [x] `lesson_pack.v1` and feedback contracts remain unchanged.
- [x] M4 persistence/export behavior remains unchanged.
- [x] Learner-facing `user_id` remains excluded.
- [x] No TTS, STT/ASR, recording, speaking assessment, or AI provider added.

## Verification Run

```text
corepack pnpm check
Result: passed. File-size check passed; 17 test files passed, 1 skipped.
95 tests passed, 7 PostgreSQL tests skipped by default.

corepack pnpm test:coverage
Result: passed. Statements 96.77%, branches 90.84%, functions 98.63%,
lines 97.79%.

corepack pnpm test:all
Result: passed with the same test and coverage results.

corepack pnpm build
Result: passed. Next.js production build compiled, typed, and generated routes.

corepack pnpm vitest run tests/integration/lesson-detail-safety-routes.test.ts
Result: passed. 1 file, 4 tests.

corepack pnpm vitest run tests/integration/learning-routes.test.ts
Result: passed. 1 file, 13 tests.

RUN_DB_TESTS=1 DATABASE_URL=<disposable>
corepack pnpm vitest run tests/integration/repository-postgres.test.ts
Result: passed. 1 file, 7 tests.

corepack pnpm playwright test tests/e2e/listening-v1.spec.ts --workers=1
Result: passed. 2 tests.

corepack pnpm playwright test tests/e2e/mvp-flow.spec.ts --workers=1
Initial result: 1 failed because the local database had not applied migration
0002. Classified as environment/schema state.

corepack pnpm db:migrate
Result: passed. Migration 0002 applied to the local development database.

corepack pnpm playwright test tests/e2e/mvp-flow.spec.ts --workers=1
Result after migration: passed. 5 tests.

corepack pnpm playwright test tests/e2e/mvp-hardening.spec.ts --workers=1
Result: passed. 3 tests.

corepack pnpm playwright test tests/e2e/listening-v2.spec.ts --workers=1
Result: passed. 5 tests.

corepack pnpm test:e2e
Result: passed. 15 tests.

corepack pnpm eval:v0
Result: passed. 1 file, 3 tests.

corepack pnpm dogfood:check
Result: passed. Real dogfood log found and eval v0 passed.

git diff --check
Result before final stage update: passed with CRLF warnings only.
```

## Last Update Notes

- Prompt 8 is complete locally and verified.
- No commit or push was made for Prompt 8.
- Prompt 9 remains separate and out of scope.
