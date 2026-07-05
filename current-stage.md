# Current Stage - Language Kit

Audit/update date: 2026-07-05
Branch: `fix/m4-data-safety-foundation`

## Stage ID

`M4_DATA_PERSISTENCE_HARDENING`

## Current Milestone Status

M4 is complete after the Prompt 4 acceptance sweep.

Prompt 1, Prompt 2, Prompt 3, and Prompt 3.5 work remains intentionally
uncommitted in one dirty stack on `fix/m4-data-safety-foundation`. Prompt 4 did
not add product features or refactor application code; it verified the stack,
applied the local dev database migration needed for E2E, and updated this stage
document.

Important operational note: the first `mvp-flow` E2E run failed because the
local Docker dev database did not yet have migration `0001_mysterious_saracen`
applied. `corepack pnpm db:migrate` applied the repo migration successfully, the
dev DB then showed `user_id DEFAULT 1 NOT NULL` on all 10 affected tables, and
the E2E rerun passed. Host `pg_dump` is still missing on PATH, so backup runtime
execution was not smoke-tested on this host.

- Milestone 1, Prompt Builder And Schema Validation: done at a usable level.
- Milestone 2, Lesson Display And Storage: done at a usable level.
- Milestone 3, Listening Checks And Logs: done at a usable level.
- Milestone 4, Roleplay, Writing, Feedback Paste, Export Cleanup, And Data Safety: complete.
- Milestone 5, Retry Drills And Dashboard: partial. Retry/dashboard basics exist; Listening v1 foundation is the next safest implementation stage.
- Milestone 6, Dataset Export: complete for the current MVP readiness gate.

## What Is Done

- Roleplay learner responses persist through `POST /api/roleplay-turns`, validated by Zod and saved through the repository. Evidence: `app/api/roleplay-turns/route.ts:7`, `app/api/roleplay-turns/route.ts:30`, `src/db/practice-repository.ts:45`.
- Roleplay saves are scoped by both lesson id and turn id. Evidence: `src/db/practice-repository.ts:56`, `src/db/practice-repository.ts:57`.
- Roleplay mismatch and invalid payload behavior is covered. Evidence: `tests/integration/learner-output-routes.test.ts:44`, `app/api/roleplay-turns/route.ts:21`.
- Roleplay responses survive lesson detail reload/reopen in E2E coverage. Evidence: `tests/e2e/mvp-flow.spec.ts:127`, `tests/e2e/mvp-flow.spec.ts:143`.
- Writing drafts persist through `POST /api/writing-submissions`, validated by Zod and saved through the repository. Evidence: `app/api/writing-submissions/route.ts:7`, `app/api/writing-submissions/route.ts:30`, `src/db/practice-repository.ts:64`.
- Writing draft saves are scoped by both lesson id and writing submission id. Evidence: `src/db/practice-repository.ts:75`, `src/db/practice-repository.ts:76`.
- Writing mismatch and invalid payload behavior is covered. Evidence: `tests/integration/learner-output-routes.test.ts:101`, `app/api/writing-submissions/route.ts:21`.
- Writing drafts survive lesson detail reload/reopen in E2E coverage. Evidence: `tests/e2e/mvp-flow.spec.ts:135`, `tests/e2e/mvp-flow.spec.ts:136`, `tests/e2e/mvp-flow.spec.ts:147`.
- Accepted feedback saves an accepted `model_outputs` row, creates `error_log` rows, creates a retry drill, and updates writing feedback fields. Evidence: `src/db/practice-repository.ts:103`, `src/db/practice-repository.ts:112`, `src/db/practice-repository.ts:118`, `src/db/practice-repository.ts:131`, `src/db/practice-repository.ts:141`.
- Accepted feedback updates `writing_submissions.feedback_json` and `writing_submissions.rubric_scores_json` without inventing a corrected writing version. Evidence: `src/lib/feedback-persistence.ts:5`, `src/lib/feedback-persistence.ts:6`, `tests/unit/feedback-persistence.test.ts:16`, `tests/integration/repository-postgres.test.ts:141`, `tests/integration/repository-postgres.test.ts:142`, `tests/integration/repository-postgres.test.ts:143`.
- Rejected feedback parse and contract failures save rejected `model_outputs` rows with `rejectionReason`, and schema-invalid JSON preserves parsed JSON when available. Evidence: `app/api/feedback/route.ts:89`, `src/db/practice-repository.ts:153`, `src/db/practice-repository.ts:174`, `src/db/practice-repository.ts:183`, `tests/integration/feedback-persistence-routes.test.ts:65`, `tests/integration/feedback-persistence-routes.test.ts:94`.
- Rejected feedback does not create feedback side effects. Evidence: `tests/integration/repository-postgres.test.ts:238`, `tests/integration/repository-postgres.test.ts:244`, `tests/integration/repository-postgres.test.ts:245`.
- Missing feedback lesson targets return 404 and avoid orphan outputs. Evidence: `tests/integration/feedback-persistence-routes.test.ts:101`, `tests/integration/repository-postgres.test.ts:188`.
- `feedback_scoring_sft` exports explicit accepted/rejected metadata, raw response, parsed JSON, source mode, provider/site, model name, and accepted feedback JSON only for accepted rows. Evidence: `src/lib/exports.ts:62`, `src/lib/exports.ts:66`, `src/lib/exports.ts:67`, `src/lib/exports.ts:78`, `tests/unit/exports.test.ts:44`, `tests/unit/exports.test.ts:74`.
- `retry_generation_sft` excludes retry drills without a real source error and includes drills linked to error log rows. Evidence: `src/lib/exports.ts:83`, `src/lib/exports.ts:87`, `src/lib/exports.ts:89`, `tests/unit/exports.test.ts:101`.
- `json_repair_sft` includes only rejected outputs with usable broken response and rejection reason, marks `accepted: false`, records `has_parsed_json`, and keeps `repaired_json: null`. Evidence: `src/lib/exports.ts:98`, `src/lib/exports.ts:100`, `src/lib/exports.ts:110`, `src/lib/exports.ts:113`, `tests/unit/exports.test.ts:129`, `tests/unit/exports.test.ts:150`.
- JSONL formatting remains valid one-object-per-line and empty exports return an empty body. Evidence: `src/lib/exports.ts:33`, `tests/unit/exports.test.ts:10`, `tests/unit/exports.test.ts:16`, `tests/unit/exports.test.ts:187`.
- Export endpoints allow-list known export kinds and reject unknown kinds safely. Evidence: `app/api/exports/[kind]/route.ts:7`, `app/api/exports/[kind]/route.ts:21`, `tests/integration/export-routes.test.ts:35`.
- `lesson_pack.v1` remains the active lesson contract and still includes listening before roleplay and writing. Evidence: `src/lib/contracts.ts:75`, `src/lib/contracts.ts:86`, `src/lib/contracts.ts:110`, `src/lib/contracts.ts:122`, `src/lib/contracts.ts:132`, `tests/unit/contracts.test.ts:10`.
- `feedback.v1`/manual feedback behavior remains route-validated and manual-relay default. Evidence: `app/api/feedback/route.ts:17`, `app/api/feedback/route.ts:60`, `app/api/feedback/route.ts:89`, `src/lib/contracts.ts:176`, `src/lib/contracts.ts:243`.
- Local backup script exists, requires `DATABASE_URL`, requires `pg_dump`, writes timestamped dumps to `backups/`, and real backups are ignored. Evidence: `scripts/backup-db.sh:4`, `scripts/backup-db.sh:9`, `scripts/backup-db.sh:14`, `scripts/backup-db.sh:17`, `scripts/backup-db.sh:20`, `backups/.gitignore:1`, `backups/.gitignore:2`.
- Backup docs warn not to commit personal learning data publicly and document restore. Evidence: `docs/backup-restore.md:3`, `docs/backup-restore.md:13`, `docs/backup-restore.md:28`, `docs/backup-restore.md:31`.
- `user_id INTEGER NOT NULL DEFAULT 1` is in the Drizzle schema for current user-owned tables and documented as a single-user placeholder, not auth. Evidence: `src/db/schema.ts:55`, `src/db/schema.ts:56`, `src/db/schema.ts:62`, `src/db/schema.ts:79`, `src/db/schema.ts:107`, `src/db/schema.ts:130`, `src/db/schema.ts:159`, `src/db/schema.ts:180`, `src/db/schema.ts:200`, `src/db/schema.ts:224`, `src/db/schema.ts:249`, `src/db/schema.ts:276`, `docs/05-data-model.md:14`.
- Migration `0001_mysterious_saracen` adds defaulted `user_id` columns to 10 affected tables. Evidence: `drizzle/0001_mysterious_saracen.sql:1`, `drizzle/0001_mysterious_saracen.sql:10`.
- Migration-on-existing-data verification passed on disposable DB `language_kit_m4_acceptance_check`: each of the 10 affected tables had one pre-existing row and one row with `user_id = 1` after applying `0001_mysterious_saracen`.
- New inserts without `user_id` persist with `user_id = 1` for a parent row and a practice row. Evidence: `tests/integration/repository-postgres.test.ts:178`, `tests/integration/repository-postgres.test.ts:182`, `tests/integration/repository-postgres.test.ts:186`, `tests/integration/repository-postgres.test.ts:187`.
- Learner-facing lesson detail responses explicitly map fields and do not expose `user_id`. Evidence: `app/api/lesson-packs/[id]/route.ts:25`, `app/api/lesson-packs/[id]/route.ts:35`, `app/api/lesson-packs/[id]/route.ts:49`, `app/api/lesson-packs/[id]/route.ts:57`, `app/api/lesson-packs/[id]/route.ts:65`, `tests/integration/lesson-detail-safety-routes.test.ts:15`, `tests/integration/lesson-detail-safety-routes.test.ts:55`, `tests/integration/lesson-detail-safety-routes.test.ts:56`.
- `test:all` exists and runs the intended non-E2E regression gate. Evidence: `package.json:18`, `package.json:19`.
- JSON export standard and infra debt tracker exist. Evidence: `docs/json-export-standard.md:1`, `docs/json-export-standard.md:5`, `docs/infra-debt.md:1`, `docs/infra-debt.md:9`, `docs/infra-debt.md:12`.

## What Is Missing

- Host backup runtime execution is not smoke-tested because `pg_dump` is not installed on this Windows PATH. Install `pg_dump` locally before relying on host backup execution.
- Prompt 1/2/3/3.5 changes are still uncommitted. This is intentional for the current stack, but should be committed or split before PR handoff.
- Real auth, a `users` table, cloud backup automation, backup encryption, TTS/STT, local model mode, paid API fallback, vector search, fine-tuning, and UI redesign remain intentionally out of scope.

## In Scope For The Next Stage

Next safest implementation prompt: `Prompt 5 - Listening v1 foundation`

- Improve the listening foundation while preserving the learning order: listening -> chunk mining -> roleplay -> writing -> feedback -> retry -> progress.
- Keep `lesson_pack.v1`, `feedback.v1`, manual AI relay, M4 persistence, export hygiene, and `user_id` API safety intact.
- Use the default B1 workplace meeting scenario for focused acceptance.

## Out Of Scope

- Auth/login/sessions/permissions
- Real `users` table
- Billing/subscription
- Cloud backup automation
- Backup encryption
- TTS/audio generation
- STT/ASR
- Voice roleplay
- Local model mode
- Paid API fallback
- Vector search
- Fine-tuning execution
- Third-party AI website automation
- `lesson_pack.v1` schema changes
- `feedback.v1`/manual feedback contract changes
- Learner-facing UI redesign

## Acceptance Checklist For Prompt 4

- [x] Prompt 1 learner-output persistence verified.
- [x] Prompt 2 feedback persistence verified.
- [x] Prompt 3 export cleanup verified.
- [x] Prompt 3.5 data safety foundation verified.
- [x] Migration-on-existing-data verification rerun against a database containing existing rows.
- [x] Existing rows received `user_id = 1`.
- [x] New inserts without `user_id` persist `user_id = 1`.
- [x] No learner-facing `user_id` leak remains in lesson detail responses.
- [x] `lesson_pack.v1` remains unchanged.
- [x] `feedback.v1`/manual feedback behavior remains unchanged.
- [x] `pnpm check` passes.
- [x] `pnpm test:coverage` passes.
- [x] `pnpm test:all` passes.
- [x] Focused export, learning-route, feedback-persistence, and lesson-detail-safety tests pass.
- [x] Opt-in PostgreSQL repository tests pass on the migrated disposable database.
- [x] E2E `mvp-flow` passes after applying the local dev DB migration.
- [x] E2E `mvp-hardening` passes.
- [x] Backup script syntax passes under Git Bash.
- [x] Host `pg_dump` missing status is accurately documented as a non-blocking operational note.
- [x] No Prompt 5 work was started.
- [x] No auth, users table, cloud backup automation, encryption, TTS/STT, local model, paid API, vector search, fine-tuning, or UI redesign was added.

## Verification Run

```text
git status --short --branch
Result: dirty worktree on fix/m4-data-safety-foundation containing intended Prompt 1/2/3/3.5 files plus current-stage.md.

corepack pnpm check
Result: passed. File-size check passed: 59 files checked, 3 legacy exceptions frozen. Vitest: 16 passed, 1 skipped; 88 tests passed, 6 skipped.

corepack pnpm test:coverage
Result: passed. Statements 96.63%, branches 87.87%, functions 98.59%, lines 97.7%.

corepack pnpm test:all
Result: passed. Ran pnpm check and pnpm test:coverage.

corepack pnpm vitest run tests/unit/exports.test.ts
Result: passed. 1 file passed, 8 tests passed.

corepack pnpm vitest run tests/integration/export-routes.test.ts
Result: passed. 1 file passed, 2 tests passed.

corepack pnpm vitest run tests/integration/learning-routes.test.ts
Result: passed. 1 file passed, 13 tests passed.

corepack pnpm vitest run tests/integration/feedback-persistence-routes.test.ts
Result: passed. 1 file passed, 4 tests passed.

corepack pnpm vitest run tests/integration/lesson-detail-safety-routes.test.ts
Result: passed. 1 file passed, 1 test passed.

docker compose up -d db
Result: Postgres service running.

docker compose exec -T db dropdb -U language_kit --if-exists language_kit_m4_acceptance_check
docker compose exec -T db createdb -U language_kit language_kit_m4_acceptance_check
Get-Content -Raw drizzle\0000_last_mongoose.sql | docker compose exec -T db psql -U language_kit -d language_kit_m4_acceptance_check -v ON_ERROR_STOP=1
Result: baseline schema applied.

Seeded one existing-style row in topics, lesson_packs, listening_inputs, chunks, listening_attempts, roleplay_turns, writing_submissions, model_outputs, error_log, and retry_drills.

Get-Content -Raw drizzle\0001_mysterious_saracen.sql | docker compose exec -T db psql -U language_kit -d language_kit_m4_acceptance_check -v ON_ERROR_STOP=1
Result: migration applied.

SELECT table row counts where user_id = 1
Result: all 10 affected tables returned rows = 1 and user_id_1 = 1.

$env:RUN_DB_TESTS = '1'; $env:DATABASE_URL = 'postgres://language_kit:language_kit@localhost:54320/language_kit_m4_acceptance_check'; corepack pnpm vitest run tests/integration/repository-postgres.test.ts
Result: passed. 1 file passed, 6 tests passed.

docker compose exec -T db dropdb -U language_kit --if-exists language_kit_m4_acceptance_check
Result: disposable acceptance database removed.

corepack pnpm playwright test tests/e2e/mvp-flow.spec.ts --workers=1
Initial result: failed. 1 failed, 4 passed. The real save path showed "Failed to save lesson" because local language_kit_dev had zero user_id columns.

docker compose exec -T db psql -U language_kit -d language_kit_dev -c "SELECT table_name, column_name, column_default, is_nullable FROM information_schema.columns WHERE table_schema='public' AND column_name='user_id' ORDER BY table_name;"
Initial result: 0 rows.

corepack pnpm db:migrate
Result: migrations applied successfully.

docker compose exec -T db psql -U language_kit -d language_kit_dev -c "SELECT table_name, column_name, column_default, is_nullable FROM information_schema.columns WHERE table_schema='public' AND column_name='user_id' ORDER BY table_name;"
Result: 10 rows; every affected table had user_id default 1 and is_nullable NO.

corepack pnpm playwright test tests/e2e/mvp-flow.spec.ts --workers=1
Final result: passed. 5 tests passed.

corepack pnpm playwright test tests/e2e/mvp-hardening.spec.ts --workers=1
Result: passed. 3 tests passed.

git diff --check
Result: passed with line-ending warnings only.

& 'C:\Program Files\Git\bin\bash.exe' -n scripts/backup-db.sh
Result: passed.

pg_dump --version
Result: failed. pg_dump is not installed on host PATH.

git status --short
Result: dirty worktree remains. Prompt stack is uncommitted; no Prompt 4 application code edits.
```

## Last Update Notes

- M4 is accepted on the current local evidence.
- Prompt 4 changed this documentation file and local database state only.
- Next prompt should be Prompt 5 - Listening v1 foundation.
