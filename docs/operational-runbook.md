# Operational Runbook

Use this runbook to start, verify, back up, recover, and smoke-test the local
Language Kit MVP. Commands assume the repository root.

## Prerequisites

- Node.js 22 LTS
- Corepack and pnpm 11
- Docker Desktop with Docker Compose
- PostgreSQL client tools (`pg_dump`, `pg_restore`, and optionally `psql`)
- Git Bash or WSL for `scripts/backup-db.sh` on Windows

## First-Time Local Setup

```powershell
corepack enable
corepack pnpm install --frozen-lockfile
Copy-Item .env.example .env
corepack pnpm db:up
corepack pnpm db:migrate
```

Do not edit `.env.example` with machine secrets. Put local overrides only in the
ignored `.env` file. Keep `LANGUAGE_KIT_LOCAL_STT_ENABLED=0` for this release.

## Start And Stop

Run the app on the host:

```powershell
corepack pnpm db:up
corepack pnpm dev
```

Or run the app and DB with Docker:

```powershell
docker compose --profile app up --build
```

Stop containers without deleting learner data:

```powershell
docker compose --profile app down
```

Do not add `-v` during routine stop or rollback because it deletes the DB volume.

## Database Migrations

Apply checked-in migrations:

```powershell
corepack pnpm db:migrate
```

Validate Drizzle migration metadata:

```powershell
corepack pnpm exec drizzle-kit check
```

Prompt 12 expects migrations `0000` through `0003` and adds no migration.

## Backup

From Git Bash or WSL, export the database URL and run:

```bash
export DATABASE_URL="postgres://language_kit:language_kit@localhost:54320/language_kit_dev"
./scripts/backup-db.sh
```

The script requires `pg_dump` and writes a UTC-named custom-format dump under
`backups/` unless another output directory is supplied. Record the printed path.

## Restore Verification

Treat a backup as unverified until `pg_restore` succeeds into a disposable
database. Never use the active database as the first restore target.

```bash
createdb language_kit_restore_smoke
export RESTORE_DATABASE_URL="postgres://language_kit:language_kit@localhost:54320/language_kit_restore_smoke"
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname "$RESTORE_DATABASE_URL" \
  backups/language-kit-YYYYMMDDTHHMMSSZ.dump
psql "$RESTORE_DATABASE_URL" -c "select count(*) from lesson_packs;"
dropdb language_kit_restore_smoke
```

With Docker client tools, create/drop the disposable DB through
`docker compose exec db` and point host `pg_restore` at port `54320`. See
`docs/backup-restore.md` for the supported variants.

## Manual Relay Operation

1. Generate a prompt in the app.
2. Copy it to an external AI tool manually.
3. Paste plain JSON back into the app.
4. Accept only the parser/Zod result shown by the app.
5. If rejected, use the generated repair guidance; never edit persistence state
   to bypass validation.

Manual relay remains the default. No provider, cloud model, or third-party
website automation is part of normal operation.

## Full Release Gate

Run focused safety regressions first:

```powershell
corepack pnpm vitest run tests/unit/release-readiness.test.ts
corepack pnpm vitest run tests/unit/model-readiness.test.ts
corepack pnpm vitest run tests/unit/adaptive-review.test.ts
corepack pnpm vitest run tests/unit/local-stt-prototype.test.ts
corepack pnpm vitest run tests/unit/exports.test.ts
corepack pnpm vitest run tests/unit/eval-set-v0.test.ts
corepack pnpm vitest run tests/integration/review-queue-routes.test.ts
corepack pnpm vitest run tests/integration/lesson-detail-safety-routes.test.ts
corepack pnpm vitest run tests/integration/speaking-attempt-routes.test.ts
```

Run E2E flows with PostgreSQL available and migrated:

```powershell
corepack pnpm playwright test tests/e2e/mvp-flow.spec.ts --workers=1
corepack pnpm playwright test tests/e2e/mvp-hardening.spec.ts --workers=1
corepack pnpm playwright test tests/e2e/listening-v2.spec.ts --workers=1
corepack pnpm playwright test tests/e2e/adaptive-review.spec.ts --workers=1
corepack pnpm playwright test tests/e2e/speaking-stt-foundation.spec.ts --workers=1
```

Finish with repository-level gates:

```powershell
corepack pnpm check
corepack pnpm test:coverage
corepack pnpm test:all
corepack pnpm build
corepack pnpm eval:v0
corepack pnpm dogfood:check
corepack pnpm model:readiness
corepack pnpm release:check
git diff --check
git status --short
```

## Post-Release Smoke

1. Confirm the DB container is healthy with `docker compose ps`.
2. Confirm `/api/health` reports `ok: true` and the database is configured.
3. Load `/` and verify API mode is used when the backend is available.
4. Save one contract-valid manual-relay lesson.
5. Verify transcript gating, roleplay, writing, feedback, retry, and progress.
6. Save a manual speaking transcript and verify no audio path is returned.
7. Download one export and parse each JSONL line.
8. Simulate an initial backend failure only in a test environment and verify the
   visible browser-only offline notice plus **Retry backend** action.

## Rollback And Recovery

Code-only rollback:

1. Stop the app.
2. Preserve any uncommitted operator notes and current database state.
3. Return to the last known-good commit using a non-destructive Git workflow.
4. Run `corepack pnpm db:migrate`, the focused safety tests, and post-release
   smoke checks.

Data rollback:

1. Stop writes and create a separate dump of the current failed state.
2. Create a clean database.
3. Use `pg_restore` with the last verified dump.
4. Point `DATABASE_URL` at the recovered database.
5. Run migrations and the post-release smoke checklist.

Never destroy the active DB or Docker volume until the recovered database is
verified and the operator has intentionally approved cleanup.

## Failure Triage

- `DATABASE_URL is required`: export it in the shell running the backup script.
- `pg_dump is required on PATH`: install PostgreSQL client tools or use a shell
  where they are already available.
- E2E connection failure: run `corepack pnpm db:up` and migrations, then inspect
  `docker compose ps`.
- Visible offline demo mode: restore backend availability and choose
  **Retry backend**; demo writes do not sync to PostgreSQL.
- 4xx API error: correct the input; it must not trigger demo fallback.
- Coverage failure: add focused tests; do not lower thresholds.

## Operational Boundaries

This runbook has no production auth, cloud deployment, provider/model serving,
production STT, fine-tuning, hosted backup, or monitoring procedure. Those are
post-MVP tracks, not hidden parts of this release.
