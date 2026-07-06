# Current Stage - Language Kit

Audit/update date: 2026-07-06
Branch: `chore/product-hardening-release`

## Stage ID

`M12_PRODUCT_HARDENING_RELEASE_READINESS`

## Current Milestone Status

Prompt 12 - Product hardening / release readiness: complete locally.

Prompt 11 was complete and committed before Prompt 12 began. Preflight found a
clean worktree on `chore/model-readiness-v1` at `d98cacad docs: complete model
readiness verification`, then created `chore/product-hardening-release`.

## Source Inspection

- All required package scripts existed except `release:check`.
- `DATABASE_URL` is the application runtime database requirement; local STT is
  optional, disabled by default, and disconnected from learner UI/API routes.
- Offline demo fallback is browser-only, visible, and pinned for the session.
- `scripts/backup-db.sh` creates custom-format UTC PostgreSQL dumps and fails if
  `DATABASE_URL` or `pg_dump` is missing.
- Drizzle migrations `0000` through `0003` validate with `drizzle-kit check`.
- API inputs use Zod or explicit parameter validation. Existing contract,
  transcript-gating, review-queue, speaking, and export safety tests remain.
- `user_id` stays internal. Speaking audio is not uploaded or persisted. Only
  the existing safe Listening audio path behavior remains learner-facing.
- Raw AI output, learner text, exports, and dogfood evidence remain sensitive
  local data and require manual review before sharing or dataset use.

## Prompt 12 Scope

- Add a deterministic release-readiness unit test and `release:check` command.
- Harden README setup, test, backup, limitation, and privacy guidance.
- Add release checklist, security/privacy review, and operational runbook docs.
- Clarify environment, backup/restore, rollback, and smoke-test instructions.
- Run focused regressions, E2E flows, repository gates, and release commands.

No major feature, API, database, provider, model, or learner payload change is
part of this stage.

## Data And Contract Impact

- `lesson_pack.v1`: unchanged.
- `feedback.v1` and manual feedback validation: unchanged.
- Database tables and migrations: unchanged.
- Learner-facing APIs and review queue payload: unchanged.
- Exports, eval set, and dataset manifest: unchanged.
- `user_id`, Listening audio, Speaking audio, and local STT boundaries:
  unchanged.

## TDD Checkpoints

- RED: `79138ee2 test: add release readiness red coverage`
  - focused test ran 10 tests and failed 8 for the missing release artifacts
- GREEN: `21bfd11e chore: add product hardening release gates`
  - the same focused target passed all 10 release-readiness tests

## Verification Run

```text
corepack pnpm vitest run tests/unit/release-readiness.test.ts
Result: passed. 1 file, 10 tests.

corepack pnpm vitest run tests/unit/model-readiness.test.ts
Result: passed. 1 file, 13 tests.

corepack pnpm vitest run tests/unit/adaptive-review.test.ts
Result: passed. 1 file, 7 tests.

corepack pnpm vitest run tests/unit/local-stt-prototype.test.ts
Result: passed. 1 file, 15 tests.

corepack pnpm vitest run tests/unit/exports.test.ts
Result: passed. 1 file, 8 tests.

corepack pnpm vitest run tests/unit/eval-set-v0.test.ts
Result: passed. 1 file, 3 tests.

corepack pnpm vitest run tests/integration/review-queue-routes.test.ts
Result: passed. 1 file, 7 tests.

corepack pnpm vitest run tests/integration/lesson-detail-safety-routes.test.ts
Result: passed. 1 file, 4 tests.

corepack pnpm vitest run tests/integration/speaking-attempt-routes.test.ts
Result: passed. 1 file, 4 tests.

corepack pnpm playwright test tests/e2e/mvp-flow.spec.ts --workers=1
Result: passed. 5 tests.

corepack pnpm playwright test tests/e2e/mvp-hardening.spec.ts --workers=1
Result: passed. 3 tests.

corepack pnpm playwright test tests/e2e/listening-v2.spec.ts --workers=1
Result: passed. 5 tests.

corepack pnpm playwright test tests/e2e/adaptive-review.spec.ts --workers=1
Result: passed. 2 tests.

corepack pnpm playwright test tests/e2e/speaking-stt-foundation.spec.ts --workers=1
Result: passed. 3 tests.

corepack pnpm check
Result: passed. File-size and TypeScript checks passed. 25 test files passed,
1 skipped. 157 tests passed, 8 PostgreSQL tests skipped by default.

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

corepack pnpm release:check
Result: passed. 1 file, 10 tests.
```

Docker Desktop was initially stopped during E2E setup. After starting the local
engine, `corepack pnpm db:up` and `corepack pnpm db:migrate` passed, and all five
requested E2E files passed without application changes.

Security/privacy review passed for Prompt 12 scope. No secret, identifier,
speaking-audio, provider, model, database, migration, contract, export, eval,
dataset-manifest, or learner-facing payload change was added.

## Next Stage

After Prompt 12 passes, core MVP work is complete. Optional post-MVP tracks
require separate approval: auth/multi-user isolation, production deployment,
production local STT, vector memory/search, model serving/fine-tuning execution,
and mobile/PWA polish.

No push was made.
