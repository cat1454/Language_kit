# Release Readiness

Language Kit Prompt 12 prepares the local single-user MVP for a reproducible
developer release. It is not a claim of production, hosted, or multi-user
readiness.

## Release Boundary

This release includes the listening-first learner flow, strict AI-output
validation, manual AI relay, local PostgreSQL persistence, deterministic review,
exports, eval checks, dogfood evidence checks, and model-readiness documentation.

It includes:

- no production authentication or multi-user isolation
- no cloud deployment
- no production model serving or provider integration
- no production STT
- no fine-tuning or training execution
- no vector search
- no speaking-audio upload or persistence

Those capabilities are optional post-MVP tracks and require separate design,
privacy, security, migration, and acceptance work.

## Local Setup

Prerequisites:

- Node.js 22 LTS
- Corepack with pnpm 11
- Docker Desktop with Docker Compose
- PostgreSQL client tools for backup/restore verification

```powershell
corepack enable
corepack pnpm install --frozen-lockfile
Copy-Item .env.example .env
corepack pnpm db:up
corepack pnpm db:migrate
corepack pnpm dev
```

Open `http://localhost:3000` and verify `http://localhost:3000/api/health`.
The default database binds only to `127.0.0.1:54320`.

## Environment Setup

- `DATABASE_URL` selects the local PostgreSQL database.
- `POSTGRES_HOST_PORT` optionally changes the Compose host port.
- `NEXT_PUBLIC_APP_NAME` controls the displayed app name when used.
- `LANGUAGE_KIT_LOCAL_STT_ENABLED` must stay `0` for this release.
- `LANGUAGE_KIT_LOCAL_STT_COMMAND` must stay empty unless a developer is
  separately evaluating the disconnected prototype.

Do not add provider keys, cloud credentials, or real secrets to `.env.example`.
Keep the copied `.env` local and uncommitted.

## Database Migration

The current migration sequence is `0000` through `0003`. Prompt 12 adds no
migration. Apply existing migrations with:

```powershell
corepack pnpm db:migrate
```

Validate migration metadata without changing the database with:

```powershell
corepack pnpm exec drizzle-kit check
```

## Backup And Restore

Before a release checkpoint or risky data operation, export `DATABASE_URL` in a
Bash-compatible shell and run:

```bash
./scripts/backup-db.sh
```

Restore every release candidate backup into a disposable database with
`pg_restore` before treating it as usable. Follow `docs/backup-restore.md`; do
not replace the active database as the first restore test.

## Manual Relay Workflow

Manual AI relay remains the default and only approved learner content path:

1. Generate a lesson or feedback prompt in Language Kit.
2. Copy it to a separately chosen AI tool.
3. Paste the returned JSON into Language Kit.
4. Let the existing parser and Zod contract accept or reject it.
5. Never bypass validation or persist an unvalidated parsed object as accepted.

No third-party AI website automation or required paid provider is included.

## Test Matrix

| Gate | Command | Purpose |
|---|---|---|
| Release contract | `corepack pnpm release:check` | Required docs, scripts, boundaries, and secret patterns |
| Repository check | `corepack pnpm check` | File size, TypeScript, and default tests |
| Coverage | `corepack pnpm test:coverage` | Enforce 80% global thresholds |
| Combined gate | `corepack pnpm test:all` | Repository check plus coverage |
| Production build | `corepack pnpm build` | Next.js compile, type, and route generation |
| Eval v0 | `corepack pnpm eval:v0` | Deterministic contract/export regression set |
| Dogfood | `corepack pnpm dogfood:check` | Real evidence exists and eval v0 passes |
| Model readiness | `corepack pnpm model:readiness` | Manifest and readiness policy validation |

PostgreSQL repository tests remain opt-in and must target a disposable database:

```powershell
$env:RUN_DB_TESTS="1"
$env:DATABASE_URL="postgres://language_kit:language_kit@localhost:54320/language_kit_test"
corepack pnpm vitest run tests/integration/repository-postgres.test.ts
```

## E2E Matrix

Start PostgreSQL, apply migrations, then run the critical flows one worker at a
time for stable local evidence:

```powershell
corepack pnpm playwright test tests/e2e/mvp-flow.spec.ts --workers=1
corepack pnpm playwright test tests/e2e/mvp-hardening.spec.ts --workers=1
corepack pnpm playwright test tests/e2e/listening-v2.spec.ts --workers=1
corepack pnpm playwright test tests/e2e/adaptive-review.spec.ts --workers=1
corepack pnpm playwright test tests/e2e/speaking-stt-foundation.spec.ts --workers=1
```

## Privacy Boundary

- `user_id` is an internal single-user placeholder and is not a learner-facing
  identity or authorization boundary.
- Listening detail may return only the established safe lesson audio path and
  validated variant paths needed for playback.
- Speaking audio remains a page-session Blob URL and is not uploaded, persisted,
  or returned by learner APIs.
- Raw prompts, raw model output, learner text, feedback, exports, and dogfood
  notes may contain personal data. Keep them local and review before sharing.
- Export builders omit `user_id` and audio paths, but their text content still
  requires privacy, secret, license, provenance, and leakage review.

See `docs/security-privacy-review.md` for the complete audit.

## Known Limitations

- Single-user local placeholder only; no authentication or authorization.
- Local development database and browser demo fallback only.
- Manual AI relay only; AI quality and availability are external concerns.
- Text roleplay and manual speaking transcript only.
- Local STT prototype is disabled and disconnected.
- No hosted backup, encryption, retention automation, monitoring, or CI/CD.
- No production deployment, support SLA, model serving, or training pipeline.

## Rollback And Checkpoints

- Start release work from a clean, committed stage checkpoint.
- Create a verified database backup before risky local data changes.
- Preserve TDD RED/GREEN commits until their evidence is recorded.
- To roll back code, return to the last known-good commit without deleting local
  learner data.
- To roll back data, restore a verified dump into a clean database, rerun
  migrations, then repeat the post-release smoke checklist.
- Never use `docker compose down -v` during routine rollback; it deletes the
  database volume.

## Pre-Release Checklist

- [ ] Worktree scope contains only Prompt 12 changes.
- [ ] `.env.example` contains no real secrets and local STT remains disabled.
- [ ] Drizzle migration metadata validates; no unexpected migration exists.
- [ ] A recent backup restores into a disposable database.
- [ ] Focused safety regressions pass.
- [ ] All five E2E flow files pass.
- [ ] `check`, coverage, `test:all`, build, eval, dogfood, model readiness, and
      `release:check` pass.
- [ ] `git diff --check` passes.
- [ ] Known limitations and privacy boundaries were reviewed.

## Post-Release Smoke Checklist

- [ ] `GET /api/health` returns `ok: true` with database configured.
- [ ] Home page loads in API mode when PostgreSQL is available.
- [ ] A manual-relay lesson validates and saves.
- [ ] Transcript remains hidden until listening checks complete.
- [ ] Roleplay, writing, feedback, retry, and progress/review surfaces load.
- [ ] Speaking saves only the manual transcript and no audio path.
- [ ] Each export downloads parseable JSONL without `user_id` or audio paths.
- [ ] Initial backend failure shows the visible browser-only demo notice.
- [ ] Backup command can create a new local dump.
