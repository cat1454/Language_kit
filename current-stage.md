# Current Stage - Language Kit

Audit/update date: 2026-07-05
Branch: `chore/dogfood-eval-v0`

## Stage ID

`M7_DOGFOOD_EVAL_SET_V0`

## Current Milestone Status

Prompt 7 - Dogfood + eval set v0: complete.

Prompt 6 was checkpoint committed before this work started. Preflight was clean
on `chore/dogfood-eval-v0`, with latest Prompt 6 commit
`fcf3a51 Complete prompt schema hardening`.

- Milestone 1, Prompt Builder And Schema Validation: hardened and covered by eval v0.
- Milestone 2, Lesson Display And Storage: done at a usable level.
- Milestone 3, Listening Checks And Logs: done at a usable level.
- Milestone 4, Roleplay, Writing, Feedback Paste, Export Cleanup, And Data Safety: complete.
- Milestone 5, Listening v1 foundation: complete.
- Milestone 6, Dataset Export: covered by eval v0 shape checks.
- Milestone 7, Dogfood + Eval Set v0: complete.

## What Is Done

- Prompt 6 was committed before Prompt 7 started. Evidence: `git log -1 --oneline` returned `fcf3a51 Complete prompt schema hardening` during Prompt 7 preflight.
- Eval v0 has exactly 24 JSONL rows across lesson contract, feedback contract, JSON repair seed, and export JSONL shape tasks. Evidence: `eval/eval_set_v0.jsonl:1`, `eval/eval_set_v0.jsonl:24`, `tests/unit/eval-set-v0.test.ts:63`, `tests/unit/eval-set-v0.test.ts:64`.
- Eval rows use stable IDs, known task types, known sources, known fixtures/mutations/check names, accepted/rejected expectations, and rejection reasons for rejected rows. Evidence: `tests/unit/eval-set-v0.test.ts:68`, `tests/unit/eval-set-v0.test.ts:98`, `tests/unit/eval-set-v0.test.ts:102`, `tests/unit/eval-set-v0.test.ts:116`.
- The eval validator loads `eval/eval_set_v0.jsonl` and rejects unknown eval vocabulary through deterministic checks. Evidence: `tests/unit/eval-set-v0.test.ts:71`, `tests/unit/eval-set-v0.test.ts:73`, `tests/unit/eval-set-v0.test.ts:91`, `tests/unit/eval-set-v0.test.ts:98`.
- Lesson eval rows run through the existing `parseAiJson()` and `validateLessonPack()` path. Evidence: `tests/unit/eval-set-v0.test.ts:129`, `tests/unit/eval-set-v0.test.ts:132`.
- Feedback eval rows run through the existing `parseManualFeedbackJson()` and `validateFeedback()` path. Evidence: `tests/unit/eval-set-v0.test.ts:137`, `tests/unit/eval-set-v0.test.ts:140`.
- JSON repair seed rows are captured as future repair examples without adding a repair model or relaxing validation. Evidence: `eval/eval_set_v0.jsonl:17`, `eval/eval_set_v0.jsonl:20`, `tests/unit/eval-set-v0.test.ts:144`.
- Export eval rows exercise the existing export builders and JSONL formatter. Evidence: `tests/unit/eval-set-v0.test.ts:149`, `tests/unit/eval-set-v0.test.ts:150`, `tests/unit/eval-set-v0.test.ts:215`.
- Dataset exports received additive readiness metadata: lesson generation rows now include `task_type` and `accepted`; JSON repair rows now include `raw_response`, `source_mode`, `provider_or_site`, and `model_name`. Evidence: `src/lib/exports.ts:53`, `src/lib/exports.ts:54`, `src/lib/exports.ts:114`, `src/lib/exports.ts:118`, `src/lib/exports.ts:119`, `src/lib/exports.ts:120`.
- `eval:v0` runs the eval validator through Vitest, avoiding a new TS runner dependency. Evidence: `package.json:19`.
- Eval docs explain that Eval v0 checks contract/export readiness only and does not call AI providers. Evidence: `docs/eval-v0.md:3`, `docs/eval-v0.md:4`, `docs/eval-v0.md:23`.
- Dogfood docs define the 20-50 session target, default B1 workplace lane, manual relay flow, and privacy limits. Evidence: `docs/dogfood-plan.md:5`, `docs/dogfood-plan.md:8`, `docs/dogfood-plan.md:23`.
- Dogfood log template exists and explicitly avoids secrets or unnecessary personal data. Evidence: `eval/dogfood_log_template.md:3`.
- `lesson_pack.v1` and `feedback.v1` validation remain unchanged. Evidence: `src/lib/contracts.ts:75`, `src/lib/contracts.ts:141`, `tests/unit/contracts.test.ts:10`, `tests/unit/contracts.test.ts:93`.

## What Is Missing

- No real dogfood sessions have been run yet.
- Eval v0 does not measure real model quality or compare providers.
- No gold-standard teacher-reviewed dataset exists yet.
- No fine-tuning, local model, paid API fallback, TTS/STT, auth, or UI review workflow was added.

## In Scope For The Next Stage

Next safest implementation prompt: `Prompt 7.5 - First dogfood run + eval calibration`

- Run the first real manual-relay dogfood sessions in the default B1 workplace lane.
- Record accepted/rejected outputs with the dogfood log template.
- Add or adjust eval rows only when real dogfood failures reveal missing deterministic coverage.
- Keep `lesson_pack.v1`, `feedback.v1`, Listening v1, M4 persistence, export hygiene, and `user_id` API safety intact.

## Out Of Scope

- `lesson_pack.v1` schema changes
- `feedback.v1`/manual feedback contract changes
- Zod parser permissiveness changes
- Database migrations
- Learner-facing API payload changes
- AI provider integration
- Third-party AI website automation
- Fine-tuning execution
- TTS/STT
- Listening v1 audio changes
- Shadowing, dictation, chunk replay, multi-voice, or speed controls
- Auth/login/sessions/permissions
- Local model or paid model integration

## Acceptance Checklist For Prompt 7

- [x] Prompt 6 checkpoint commit verified before Prompt 7 code changes.
- [x] Worktree was clean before Prompt 7.
- [x] Branch `chore/dogfood-eval-v0` used.
- [x] `eval/eval_set_v0.jsonl` contains exactly 24 rows.
- [x] Eval rows cover 8 lesson contract cases.
- [x] Eval rows cover 8 feedback contract cases.
- [x] Eval rows cover 4 JSON repair seed cases.
- [x] Eval rows cover 4 export JSONL shape cases.
- [x] Eval validator uses existing contract/parser/export code paths.
- [x] Eval validator rejects unknown task types, fixtures, mutations, and check names.
- [x] `eval:v0` runs without adding dependencies.
- [x] Docs explain Eval v0 is not a model benchmark.
- [x] Docs keep AI output untrusted until validation passes.
- [x] Docs keep bad JSON rejected, not silently accepted.
- [x] Docs keep manual relay as the default path.
- [x] Docs state no provider integration, fine-tuning, TTS/STT, or third-party automation was added.
- [x] Dogfood target and log template are documented.
- [x] `lesson_pack.v1` remains unchanged.
- [x] `feedback.v1`/manual feedback behavior remains unchanged.
- [x] No database migrations, learner-facing API payload changes, or Listening v1 audio changes were added.
- [x] M4/M5 safety checks still pass through the regression gate.

## Verification Run

```text
git status --short --branch
Result before Prompt 6 commit: dirty only with Prompt 6 files.

git add -A
git commit -m "Complete prompt schema hardening"
Result: committed Prompt 6 as fcf3a51.

git status --short --branch
Result after Prompt 6 commit: clean on fix/prompt-schema-hardening.

git switch -c chore/dogfood-eval-v0
Result: switched to new branch chore/dogfood-eval-v0.

git status --short
Result before Prompt 7 code changes: clean.

git log -1 --oneline
Result: fcf3a51 Complete prompt schema hardening

rg -n "Prompt 6 - Prompt/schema hardening: complete|Prompt 7 - Dogfood \+ eval set v0" current-stage.md
Result: Prompt 6 completion and Prompt 7 next-stage evidence found before this update.

corepack pnpm eval:v0
Result: passed. 1 file passed, 3 tests passed.

corepack pnpm vitest run tests/unit/eval-set-v0.test.ts
Result: passed. 1 file passed, 3 tests passed.

corepack pnpm vitest run tests/unit/contracts.test.ts
Result: passed. 1 file passed, 10 tests passed.

corepack pnpm vitest run tests/unit/manual-feedback-json.test.ts
Result: passed. 1 file passed, 5 tests passed.

corepack pnpm vitest run tests/unit/exports.test.ts
Result: passed. 1 file passed, 8 tests passed.

corepack pnpm check:file-size
Result: passed. 62 files checked, 3 legacy exceptions frozen.

corepack pnpm check
Result: passed. File-size check passed: 62 files checked, 3 legacy exceptions frozen. Vitest: 17 passed, 1 skipped; 93 tests passed, 6 skipped.

corepack pnpm test:all
Result: passed. Ran pnpm check and pnpm test:coverage. Coverage: statements 96.66%, branches 90.57%, functions 98.59%, lines 97.72%.

corepack pnpm vitest run tests/integration/export-routes.test.ts
Result: passed. 1 file passed, 2 tests passed.

corepack pnpm vitest run tests/integration/lesson-detail-safety-routes.test.ts
Result: passed. 1 file passed, 2 tests passed.

corepack pnpm playwright test tests/e2e/mvp-flow.spec.ts --workers=1
Result: passed. 5 tests passed.

corepack pnpm playwright test tests/e2e/listening-v1.spec.ts --workers=1
Result: passed. 2 tests passed.

git diff --check
Result: passed with CRLF line-ending warnings only.

git status --short
Result: dirty worktree with Prompt 7 files only: current-stage.md, package.json, src/lib/exports.ts, docs/dogfood-plan.md, docs/eval-v0.md, eval/eval_set_v0.jsonl, eval/dogfood_log_template.md, and tests/unit/eval-set-v0.test.ts.
```

## Last Update Notes

- Prompt 7 added deterministic eval assets, an eval Vitest runner, dogfood docs, and additive export metadata.
- No contract, parser, database, learner-facing API, AI provider, TTS/STT, or Listening v1 audio behavior changed.
- Next prompt should be Prompt 7.5 - First dogfood run + eval calibration.
