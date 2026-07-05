# Current Stage - Language Kit

Audit/update date: 2026-07-05
Branch: `chore/dogfood-eval-calibration`

## Stage ID

`M7_5_DOGFOOD_EVAL_CALIBRATION`

## Current Milestone Status

Prompt 7.5 - First dogfood run + eval calibration: complete.

Prompt 7 is complete and checkpoint committed. Preflight was clean on
`chore/dogfood-eval-calibration`, with latest Prompt 7 commit
`7a20de6 Add dogfood eval set v0`.

Prompt 7.5 reviewed the first real dogfood session log without fabricating
sessions, AI outputs, learner writing, or feedback JSON. No eval rows were
added because the real log did not include a deterministic gap with enough
evidence.

- Milestone 1, Prompt Builder And Schema Validation: hardened and covered by eval v0.
- Milestone 2, Lesson Display And Storage: done at a usable level.
- Milestone 3, Listening Checks And Logs: done at a usable level.
- Milestone 4, Roleplay, Writing, Feedback Paste, Export Cleanup, And Data Safety: complete.
- Milestone 5, Listening v1 foundation: complete.
- Milestone 6, Dataset Export: covered by eval v0 shape checks.
- Milestone 7, Dogfood + Eval Set v0: complete.
- Milestone 7.5, First Dogfood Run + Eval Calibration: complete with no eval row additions.

## What Is Done

- Prompt 7 checkpoint commit was verified before Prompt 7.5 work. Evidence: `git log -1 --oneline` returned `7a20de6 Add dogfood eval set v0`.
- Prompt 7.5 preflight started from a clean worktree on `chore/dogfood-eval-calibration`. Evidence: `git status --short --branch` returned only the branch line.
- Prompt 7 baseline still passes. Evidence: `corepack pnpm eval:v0`, `corepack pnpm check`, and `corepack pnpm test:all` passed.
- Eval v0 remains deterministic and model-free. Evidence: `tests/unit/eval-set-v0.test.ts:91`, `tests/unit/eval-set-v0.test.ts:129`, `tests/unit/eval-set-v0.test.ts:137`, `tests/unit/eval-set-v0.test.ts:149`.
- `eval/eval_set_v0.jsonl` was not changed during Prompt 7.5 because no deterministic gap was justified by the real dogfood evidence.
- The first real dogfood log was reviewed. Evidence: `eval/dogfood_sessions/2026-07-05-reschedule-meeting.md` records accepted lesson JSON, completed listening checks, correct transcript gating, saved roleplay and writing work, accepted feedback JSON, completed retry drill, and inspected JSONL export rows.
- The real log was classified as `dogfood_note_not_eval_actionable` for eval-row purposes because `Add eval seed: yes` did not include a suggested row ID, short reason, raw malformed JSON, contract rejection, or concrete export shape gap.
- `eval/dogfood_sessions/` now exists as the approved location for real dogfood logs. Evidence: `eval/dogfood_sessions/.gitkeep:1`.
- A dogfood runbook now documents how to collect real session evidence without fabricated or sensitive data. Evidence: `docs/dogfood-runbook.md:3`, `docs/dogfood-runbook.md:10`, `docs/dogfood-runbook.md:16`, `docs/dogfood-runbook.md:50`.
- Dogfood helper scripts exist for safe local automation: `dogfood:new` creates a blank session template, `dogfood:assist` opens a Playwright-assisted manual session and records user-entered evidence, and `dogfood:check` refuses placeholder or draft logs before running `eval:v0`. Evidence: `package.json:20`, `package.json:21`, `package.json:22`, `scripts/dogfood-new.mjs:35`, `scripts/dogfood-assist.mjs:34`, `scripts/dogfood-assist.mjs:53`, `scripts/dogfood-check.mjs:59`.
- Contracts remain strict and unchanged. Evidence: `src/lib/contracts.ts:75`, `src/lib/contracts.ts:141`, `src/lib/manual-feedback-json.ts:3`.

## What Is Missing

- Richer dogfood logs with raw rejected/invalid lesson or feedback JSON when failures occur.
- Concrete export shape gap notes if JSONL rows are confusing or incomplete.
- Suggested eval row IDs and short reasons whenever `Add eval seed` is marked `yes`.
- More sessions before changing eval v0 coverage beyond the current 24 rows.

## In Scope For The Next Stage

Next safest implementation prompt: `Prompt 7.6 - Dogfood evidence quality pass`

- Collect a second real dogfood session with complete evidence notes.
- If an eval seed is requested, require a row ID, short reason, and raw evidence or named export gap.
- Add at most 5 eval rows only if real evidence justifies them.
- Keep `lesson_pack.v1`, `feedback.v1`, Listening v1, M4 persistence, export hygiene, and `user_id` API safety intact.

## Out Of Scope

- Fabricated dogfood sessions
- Fabricated AI outputs
- Fabricated learner writing
- Fabricated feedback JSON
- Subjective model quality scoring
- Teacher-quality scoring
- Fluency scoring
- Automatic correction grading
- Fine-tune target generation
- `lesson_pack.v1` schema changes
- `feedback.v1`/manual feedback contract changes
- Zod parser permissiveness changes
- Database migrations
- Learner-facing API payload changes
- AI provider integration
- Third-party AI website automation
- TTS/STT
- Listening v1 audio changes

## Acceptance Checklist For Prompt 7.5

- [x] Prompt 7 checkpoint commit verified before Prompt 7.5 changes.
- [x] Worktree was clean before Prompt 7.5.
- [x] Branch `chore/dogfood-eval-calibration` used.
- [x] Prompt 7 baseline verified with `eval:v0`, focused eval test, and `pnpm check`.
- [x] Prompt 7 regression gate verified with `pnpm test:all`.
- [x] No AI/provider call was needed.
- [x] Real dogfood logs were searched.
- [x] First real dogfood log was reviewed.
- [x] Session issues were classified.
- [x] No deterministic eval-row gap was found.
- [x] Fabricated sessions, AI outputs, learner writing, and feedback JSON were avoided.
- [x] `eval/eval_set_v0.jsonl` was not modified.
- [x] `eval/dogfood_sessions/` placeholder was added.
- [x] Dogfood runbook was added.
- [x] Safe dogfood helper scripts were added without provider/model automation.
- [x] Playwright-assisted dogfood mode was added for human-entered real evidence.
- [x] Prompt 7.5 is marked complete with no eval row additions.

## Verification Run

```text
git status --short --branch
Result: clean on chore/dogfood-eval-calibration before Prompt 7.5 changes.

git log -1 --oneline
Result: 7a20de6 Add dogfood eval set v0

rg -n "Prompt 7 - Dogfood \+ eval set v0: complete|M7_DOGFOOD_EVAL_SET_V0|Prompt 7.5" current-stage.md
Result: Prompt 7 complete and Prompt 7.5 next-stage evidence found before this update.

corepack pnpm eval:v0
Result: passed. 1 file passed, 3 tests passed.

corepack pnpm vitest run tests/unit/eval-set-v0.test.ts
Result: passed. 1 file passed, 3 tests passed.

corepack pnpm check
Result: passed. File-size check passed: 62 files checked, 3 legacy exceptions frozen. Vitest: 17 passed, 1 skipped; 93 tests passed, 6 skipped.

Test-Path docs/dogfood-runbook.md; Test-Path eval/dogfood_sessions
Result before this update: False, False.

corepack pnpm eval:v0
Result after blocker/runbook update: passed. 1 file passed, 3 tests passed.

corepack pnpm check
Result after blocker/runbook update: passed. File-size check passed: 62 files checked, 3 legacy exceptions frozen. Vitest: 17 passed, 1 skipped; 93 tests passed, 6 skipped.

Get-ChildItem -Force -Recurse eval\dogfood_sessions
Result: only eval/dogfood_sessions/.gitkeep was present; no real dogfood logs were available to review.

corepack pnpm eval:v0
Result after resume request: passed. 1 file passed, 3 tests passed.

corepack pnpm check
Result after resume request: passed. File-size check passed: 62 files checked, 3 legacy exceptions frozen. Vitest: 17 passed, 1 skipped; 93 tests passed, 6 skipped.

corepack pnpm test:all
Result after resume request: passed. `pnpm check` and coverage run both passed; coverage summary statements 96.66%, branches 90.57%, functions 98.59%, lines 97.72%.

corepack pnpm dogfood:check
Result after helper update: failed by design with exit code 1 because no real dogfood logs were present. Output: "No real dogfood logs found. Use `pnpm dogfood:new <slug>`, fill it from a real session, then rerun this check."

corepack pnpm dogfood:new smoke-test
Result after helper update: passed. Created eval/dogfood_sessions/2026-07-05-smoke-test.md from the blank template; the smoke-test template file was removed afterward so it would not be confused with real evidence.

corepack pnpm eval:v0
Result after helper update: passed. 1 file passed, 3 tests passed.

corepack pnpm check
Result after helper update: passed. File-size check passed: 64 files checked, 3 legacy exceptions frozen. Vitest: 17 passed, 1 skipped; 93 tests passed, 6 skipped.

corepack pnpm test:all
Result after helper update: passed. `pnpm check` and coverage run both passed; coverage summary statements 96.66%, branches 90.57%, functions 98.59%, lines 97.72%.

Updated eval/dogfood_sessions/2026-07-05-reschedule-meeting.md
Result: prefilled safe default B1 workplace meeting metadata only; all evidence fields remain TODO after real session.

corepack pnpm dogfood:check
Result after prefilled draft update: failed by design with exit code 1 because the draft has no real yes/no evidence fields.

corepack pnpm eval:v0
Result after prefilled draft update: passed. 1 file passed, 3 tests passed.

corepack pnpm check
Result after prefilled draft update: passed. File-size check passed: 64 files checked, 3 legacy exceptions frozen. Vitest: 17 passed, 1 skipped; 93 tests passed, 6 skipped.

corepack pnpm dogfood:assist -- --dry-run
Result after Playwright assist update: passed. Output confirmed the helper is ready for eval/dogfood_sessions/2026-07-05-reschedule-meeting.md at http://localhost:3000.

corepack pnpm dogfood:check
Result after Playwright assist update: failed by design with exit code 1 because the draft still has no real yes/no evidence fields.

corepack pnpm eval:v0
Result after Playwright assist update: passed. 1 file passed, 3 tests passed.

corepack pnpm check
Result after Playwright assist update: passed. File-size check passed: 65 files checked, 3 legacy exceptions frozen. Vitest: 17 passed, 1 skipped; 93 tests passed, 6 skipped.

corepack pnpm dogfood:check
Result after real dogfood log update: passed. Real dogfood log found: eval/dogfood_sessions/2026-07-05-reschedule-meeting.md. Eval v0 passed with 1 file passed and 3 tests passed.

Reviewed eval/dogfood_sessions/2026-07-05-reschedule-meeting.md
Result: accepted lesson JSON, listening completed, transcript gating passed, roleplay and writing saved, feedback accepted, retry completed, exports inspected. No eval rows added because no raw invalid output, contract rejection, export gap, suggested row ID, or short reason was present.

corepack pnpm eval:v0
Result after Prompt 7.5 completion update: passed. 1 file passed, 3 tests passed.

corepack pnpm check
Result after Prompt 7.5 completion update: passed. File-size check passed: 65 files checked, 3 legacy exceptions frozen. Vitest: 17 passed, 1 skipped; 93 tests passed, 6 skipped.

corepack pnpm test:all
Result after Prompt 7.5 completion update: passed. `pnpm check` and coverage run both passed; coverage summary statements 96.66%, branches 90.57%, functions 98.59%, lines 97.72%.

git diff -- eval/eval_set_v0.jsonl
Result: no diff; eval set unchanged.

git diff --check
Result: passed with CRLF line-ending warnings only.

git status --short --branch
Result: dirty worktree with Prompt 7.5 blocker files current-stage.md, docs/dogfood-runbook.md, and eval/dogfood_sessions/.gitkeep, plus unrelated local/generated next-env.d.ts churn.
```

## Last Update Notes

- Prompt 7.5 reviewed the first real dogfood log and is complete with no eval row additions.
- No eval rows were added or changed because no deterministic gap had enough evidence.
- No contract, parser, database, learner-facing API, AI provider, TTS/STT, export behavior, or Listening v1 audio behavior changed.
- Next prompt should collect richer dogfood evidence before changing eval v0.
