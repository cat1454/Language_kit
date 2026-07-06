# Current Stage - Language Kit

Audit/update date: 2026-07-06
Branch: `chore/product-hardening-release`

## Stage ID

`M12_PRODUCT_HARDENING_RELEASE_READINESS`

## Current Milestone Status

Prompt 12 - Product hardening / release readiness: verification in progress.

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
- GREEN: pending focused release-check verification

## Verification Run

Pending final Prompt 12 verification matrix.

## Next Stage

After Prompt 12 passes, core MVP work is complete. Optional post-MVP tracks
require separate approval: auth/multi-user isolation, production deployment,
production local STT, vector memory/search, model serving/fine-tuning execution,
and mobile/PWA polish.

No push was made.
