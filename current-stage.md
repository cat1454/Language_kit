# Current Stage - Language Kit

Audit/update date: 2026-07-05
Branch: `fix/prompt-schema-hardening`

## Stage ID

`M6_PROMPT_SCHEMA_HARDENING`

## Current Milestone Status

Prompt 6 - Prompt/schema hardening: complete.

Prompt 5 was checkpoint committed before this work started. Preflight was clean
on `fix/prompt-schema-hardening`, with latest commit
`4719c4d Complete Listening v1 foundation`.

- Milestone 1, Prompt Builder And Schema Validation: hardened for manual relay prompts.
- Milestone 2, Lesson Display And Storage: done at a usable level.
- Milestone 3, Listening Checks And Logs: done at a usable level.
- Milestone 4, Roleplay, Writing, Feedback Paste, Export Cleanup, And Data Safety: complete.
- Milestone 5, Listening v1 foundation: complete.
- Milestone 6, Dataset Export: complete for the current MVP readiness gate.

## What Is Done

- Lesson generation prompts now ask for raw JSON only, no markdown fences, no comments, and no prose before or after JSON. Evidence: `src/lib/prompts.ts:20`, `tests/unit/prompts.test.ts:25`.
- Lesson prompts keep `lesson_pack.v1` as the only lesson schema and add compact guidance for exact top-level keys, no extra top-level keys, listening input, comprehension checks, chunks, roleplay, writing, retry drills, and quality checks. Evidence: `src/lib/prompts.ts:21`, `src/lib/prompts.ts:30`, `src/lib/prompt-schema-guides.ts:1`, `src/lib/prompt-schema-guides.ts:2`, `src/lib/prompt-schema-guides.ts:5`, `src/lib/prompt-schema-guides.ts:6`, `src/lib/prompt-schema-guides.ts:8`, `src/lib/prompt-schema-guides.ts:14`.
- Lesson prompts explicitly preserve listening-first pedagogy, 60-90 second listening input, 5-8 chunks, and transcript gating before listening completion. Evidence: `src/lib/prompts.ts:29`, `src/lib/prompts.ts:31`, `src/lib/prompt-schema-guides.ts:6`, `src/lib/prompt-schema-guides.ts:8`, `src/lib/prompt-schema-guides.ts:15`.
- Feedback prompts now ask for raw JSON only and include compact `feedback.v1` guidance for scores, error log fields, positive notes, retry priority, and retry drill structure. Evidence: `src/lib/prompts.ts:62`, `src/lib/prompts.ts:63`, `src/lib/prompt-schema-guides.ts:19`, `src/lib/prompt-schema-guides.ts:20`, `src/lib/prompt-schema-guides.ts:21`, `src/lib/prompt-schema-guides.ts:22`, `src/lib/prompt-schema-guides.ts:28`.
- Prompt tests cover the hardened lesson and feedback prompt wording and ensure generated prompts do not contain markdown fences. Evidence: `tests/unit/prompts.test.ts:25`, `tests/unit/prompts.test.ts:26`, `tests/unit/prompts.test.ts:30`, `tests/unit/prompts.test.ts:41`, `tests/unit/prompts.test.ts:78`, `tests/unit/prompts.test.ts:79`, `tests/unit/prompts.test.ts:88`.
- `lesson_pack.v1` Zod validation remains the canonical lesson contract. Evidence: `src/lib/contracts.ts:75`, `src/lib/contracts.ts:273`, `tests/unit/contracts.test.ts:10`.
- Manual feedback parsing and the feedback route remain unchanged in behavior. Evidence: `src/lib/manual-feedback-json.ts:3`, `app/api/feedback/route.ts:39`, `tests/unit/manual-feedback-json.test.ts:15`, `tests/unit/manual-feedback-json.test.ts:28`, `tests/unit/manual-feedback-json.test.ts:35`.
- Listening v1 remains intact: safe audio path mapping, fixed playback rate, fallback demo listening, and transcript gating still pass. Evidence: `app/api/lesson-packs/[id]/route.ts:37`, `src/components/lesson-listening-panel.tsx:145`, `src/components/lesson-listening-panel.tsx:148`, `src/components/lesson-listening-panel.tsx:154`, `src/components/lesson-listening-panel.tsx:197`, `tests/e2e/listening-v1.spec.ts:22`, `tests/e2e/listening-v1.spec.ts:23`, `tests/e2e/listening-v1.spec.ts:28`.
- Manual relay documentation now says prompts include compact contract guidance, while Zod validation remains the acceptance gate. Evidence: `docs/03-ai-execution-modes.md:22`, `docs/03-ai-execution-modes.md:31`, `docs/03-ai-execution-modes.md:72`, `docs/03-ai-execution-modes.md:94`, `docs/04-data-contracts.md:21`.

## What Is Missing

- Prompt 6 did not measure real model compliance against a saved evaluation set.
- No golden prompt-output fixtures were added beyond prompt text assertions.
- No UI affordance was added for comparing rejected manual relay outputs.
- No AI provider, local model, third-party automation, or model fallback was added.

## In Scope For The Next Stage

Next safest implementation prompt: `Prompt 7 - Dogfood + eval set v0`

- Create a small dogfood/evaluation set for B1 workplace lessons and manual feedback outputs.
- Capture real invalid-output examples without weakening parser or Zod validation.
- Keep `lesson_pack.v1`, `feedback.v1`, Listening v1, M4 persistence, export hygiene, and `user_id` API safety intact.

## Out Of Scope

- `lesson_pack.v1` schema changes
- `feedback.v1`/manual feedback contract changes
- Zod parser permissiveness changes
- API payload changes
- Database migrations
- AI provider integration
- Third-party AI website automation
- TTS/STT
- Listening v1 audio changes
- Shadowing, dictation, chunk replay, multi-voice, or speed controls
- Auth/login/sessions/permissions
- Local model or paid model integration
- Fine-tuning execution

## Acceptance Checklist For Prompt 6

- [x] Prompt 5 checkpoint commit verified before Prompt 6 code changes.
- [x] Worktree was clean before Prompt 6.
- [x] Branch `fix/prompt-schema-hardening` used.
- [x] Lesson prompt requests raw JSON only.
- [x] Lesson prompt says not to include markdown fences, comments, or surrounding prose.
- [x] Lesson prompt includes compact `lesson_pack.v1` schema guidance.
- [x] Lesson prompt keeps listening-first order, 60-90 second listening input, 5-8 chunks, and transcript gating.
- [x] Feedback prompt requests raw JSON only.
- [x] Feedback prompt includes compact `feedback.v1` guidance for scores, error log fields, and retry drill.
- [x] Prompt tests cover the hardened guidance.
- [x] `lesson_pack.v1` remains unchanged.
- [x] `feedback.v1`/manual feedback behavior remains unchanged.
- [x] No Zod validation or parser permissiveness was changed.
- [x] No API payloads or database migrations were changed.
- [x] No AI provider, third-party automation, TTS/STT, or Listening v1 audio work was added.
- [x] M4 persistence/export/user_id safety checks still pass through the regression gate.
- [x] Listening v1 E2E checks still pass.

## Verification Run

```text
git status --short
Result: clean before Prompt 6 code changes.

git log -1 --oneline
Result: 4719c4d Complete Listening v1 foundation

rg -n "Prompt 5 - Listening v1 foundation|Listening v1 foundation: complete|M5_LISTENING_V1_FOUNDATION" current-stage.md
Result: Prompt 5 completion evidence found before this update.

corepack pnpm vitest run tests/unit/prompts.test.ts
Result: passed. 1 file passed, 4 tests passed.

corepack pnpm vitest run tests/unit/contracts.test.ts
Result: passed. 1 file passed, 10 tests passed.

corepack pnpm vitest run tests/unit/manual-feedback-json.test.ts
Result: passed. 1 file passed, 5 tests passed.

corepack pnpm check
Result: passed. File-size check passed: 61 files checked, 3 legacy exceptions frozen. Vitest: 16 passed, 1 skipped; 90 tests passed, 6 skipped.

corepack pnpm test:coverage
Result: passed. Statements 96.66%, branches 87.87%, functions 98.59%, lines 97.72%.

corepack pnpm test:all
Result: passed. Ran pnpm check and pnpm test:coverage.

corepack pnpm vitest run tests/integration/lesson-detail-safety-routes.test.ts
Result: passed. 1 file passed, 2 tests passed.

corepack pnpm vitest run tests/integration/learning-routes.test.ts
Result: passed. 1 file passed, 13 tests passed.

corepack pnpm playwright test tests/e2e/mvp-flow.spec.ts --workers=1
Result: passed. 5 tests passed.

corepack pnpm playwright test tests/e2e/mvp-hardening.spec.ts --workers=1
Result: passed. 3 tests passed.

corepack pnpm playwright test tests/e2e/listening-v1.spec.ts --workers=1
Result: passed. 2 tests passed.

git diff --check
Result: passed with CRLF line-ending warnings only.

git status --short
Result: dirty worktree with Prompt 6 files only: current-stage.md, docs/03-ai-execution-modes.md, docs/04-data-contracts.md, src/lib/prompts.ts, tests/unit/prompts.test.ts, and src/lib/prompt-schema-guides.ts.
```

## Last Update Notes

- Prompt 6 changed prompt construction, prompt tests, and docs only.
- No contract, parser, route payload, database, export, or Listening v1 behavior changed.
- Next prompt should be Prompt 7 - Dogfood + eval set v0.
