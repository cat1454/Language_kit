# Current Stage - Language Kit

Audit/update date: 2026-07-06
Branch: `feat/adaptive-review-v1`

## Stage ID

`M10_ADAPTIVE_REVIEW_V1`

## Current Milestone Status

Prompt 10 - Adaptive review v1: complete locally.

Prompt 9.5 was committed before Prompt 10 began. Preflight was clean on
`feat/adaptive-review-v1`, with Prompt 9.5 completion commit
`48531a4 docs: complete local STT prototype spike`.

Prompt 10 adds a deterministic, explainable review queue derived from existing
learner practice data. It does not add AI ranking, vector search, spaced
repetition scheduling, notifications, model integration, or STT wiring.

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
- Milestone 9.5, Local STT Prototype Spike: complete.
- Milestone 10, Adaptive Review v1: complete locally.

## Source Inspection

Existing signals used:

- `retry_drills`, including completion state and feedback-linked drills
- `error_log` feedback corrections and retry priority
- `listening_attempts` scores and missed details
- `writing_submissions` drafts, accepted feedback, and correction state
- `roleplay_turns` saved learner responses without follow-up feedback
- `speaking_attempts` manual transcripts without selecting audio paths

Signals inspected but not used directly:

- `model_outputs`: feedback rows exist, but the table has no lesson-pack foreign
  key and includes large raw prompts/responses. Accepted feedback is represented
  more safely through errors, retry drills, and writing feedback.
- dashboard summary: useful for aggregate metrics, but it has no lesson or
  learner action for a review item.

No migration was needed.

## What Is Done

- Added `src/lib/adaptive-review.ts` with stable item IDs, fixed priority rules,
  snippet caps, deterministic sorting, and summary counts.
- Added `src/db/review-repository.ts` with explicit field selection and internal
  single-user filtering.
- Added `GET /api/review-queue` with strict `lessonId` and `limit` validation.
- Added a dashboard **Review next** panel with empty, error, and populated
  states plus lesson links and action hints.
- Preserved the existing browser-only demo fallback through a derived mock
  review queue.
- Added unit, integration, and Playwright coverage.
- Added adaptive review documentation and updated learning flow, data model,
  and infrastructure debt notes.

## Adaptive Review Rules

Priority 4 urgent:

- unfinished retry drills linked to accepted feedback errors
- unresolved high-priority feedback errors

Priority 3 high:

- weak listening checks or missed details
- writing with accepted feedback and unresolved corrections

Priority 2 normal:

- lesson retry drills not linked to feedback
- writing drafts without feedback
- saved roleplay responses without follow-up feedback
- manual speaking transcripts

Priority 1 low:

- completed retry drills
- resolved feedback errors

Stable sort:

1. priority descending
2. source timestamp descending
3. stable item ID ascending

Missing or invalid timestamps use a deterministic zero-time fallback.

## Privacy And Safety Decisions

- `user_id` is filtered internally and never returned.
- `speaking_attempts.audio_path` is not selected.
- Listening audio paths are not selected.
- Evidence snippets are capped at 180 characters.
- Raw database rows, model prompts, model responses, and large transcript/body
  payloads are not returned.
- Query parameters are allowlisted, single-valued, and strictly validated.
- No network provider, model execution, upload, audio persistence, or STT
  connection was added.

## Data And Contract Impact

- `lesson_pack.v1`: unchanged.
- `feedback.v1` and manual feedback validation: unchanged.
- Database tables: unchanged.
- Migration: none.
- Lesson detail payload: unchanged.
- Speaking attempt payload and response: unchanged.
- Review queue payload: added.
- Exports: unchanged.
- Eval set: unchanged.
- Learner-facing `user_id`: excluded and regression verified.
- Audio paths: excluded and regression verified.

## API

`GET /api/review-queue`

- optional `lessonId`: positive integer
- optional `limit`: positive integer, default 10, maximum 25
- invalid, unknown, duplicate, or over-limit parameters return HTTP 400
- response contains compact `items` and priority-bucket `summary`

## In Scope For The Next Stage

Recommended next implementation stage:

Prompt 11 - Local model/eval/fine-tune readiness.

Prompt 10 does not authorize spaced repetition scheduling, due dates, vector
memory, notifications, auth, model ranking, local model execution, or STT
production wiring.

## Acceptance Checklist For Prompt 10

- [x] Prompt 9.5 checkpoint commit verified.
- [x] Prompt 10 started from a clean `feat/adaptive-review-v1` branch.
- [x] Deterministic review model exists.
- [x] Stable IDs, snippet caps, priority rules, and sorting are tested.
- [x] Review repository derives items from existing persisted tables.
- [x] No migration or contract change was added.
- [x] `GET /api/review-queue` exists with strict query validation.
- [x] Dashboard review panel supports empty, populated, error, and demo states.
- [x] `user_id` and audio path safety are verified.
- [x] Listening v2 and speaking foundation regressions pass.
- [x] Eval and dogfood checks pass.

## TDD Checkpoints

- RED: `79a2032 test: add adaptive review queue red coverage`
- GREEN: `7ace972 feat: add deterministic adaptive review queue`

## Verification Run

```text
corepack pnpm vitest run tests/unit/adaptive-review.test.ts
Result: passed. 1 file, 7 tests.

corepack pnpm vitest run tests/integration/review-queue-routes.test.ts
Result: passed. 1 file, 7 tests.

corepack pnpm vitest run tests/integration/learning-routes.test.ts
Result: passed. 1 file, 13 tests.

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
Result: passed. File-size and TypeScript checks passed. 23 test files passed,
1 skipped. 134 tests passed, 8 PostgreSQL tests skipped by default.

corepack pnpm test:coverage
Result: passed. Statements 90.13%, branches 85.20%, functions 92.68%,
lines 91.40%.

corepack pnpm test:all
Result: passed with the same 134 tests and coverage results.

corepack pnpm build
Result: passed. Next.js production build compiled, typed, generated pages, and
included GET /api/review-queue.

corepack pnpm eval:v0
Result: passed. 1 file, 3 tests.

corepack pnpm dogfood:check
Result: passed. Real dogfood log found and eval v0 passed.

Security review
Result: passed for Prompt 10 scope. Query parameters are strictly validated,
database queries are parameterized, only explicit fields are selected, audio
paths are not selected, user_id is internal only, and evidence is capped.

git diff --check
Result: passed with CRLF warnings only.
```

## Last Update Notes

- Prompt 10 is complete locally.
- RED and GREEN checkpoint commits exist on the active branch.
- Final documentation checkpoint was created as `71932b4`.
- No push was made.
