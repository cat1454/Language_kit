# Backup And Restore

Language Kit stores personal learning data. Keep backups local, restrict access,
and never commit real database backups. The repository ignores `backups/` except
for its `.gitignore` placeholder.

## Create A Local Backup

Install PostgreSQL client tools so `pg_dump` and `pg_restore` are on `PATH`.
Set `DATABASE_URL` in the current shell, then run from Git Bash, WSL, or another
Bash-compatible shell:

```bash
export DATABASE_URL="postgres://language_kit:language_kit@localhost:54320/language_kit_dev"
./scripts/backup-db.sh
```

On Windows, the script is Bash rather than PowerShell; Git Bash is the simplest
supported path. The script fails clearly if `DATABASE_URL` or `pg_dump` is
missing. It writes a PostgreSQL custom-format dump to `backups/` by default and
uses a UTC timestamp in the filename.

To choose a different local output directory:

```bash
./scripts/backup-db.sh /path/to/backup-dir
```

This release does not automate cloud upload, scheduling, retention, or backup
encryption. Protect the output as personal learner data.

## Restore A Backup

Never test restore against the active development database first. Create a
disposable database, point a separate URL at it, and restore there:

```bash
createdb language_kit_restore_smoke
export RESTORE_DATABASE_URL="postgres://language_kit:language_kit@localhost:54320/language_kit_restore_smoke"
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname "$RESTORE_DATABASE_URL" \
  backups/language-kit-YYYYMMDDTHHMMSSZ.dump
```

If `createdb` is unavailable on the host, create the disposable database through
`docker compose exec db createdb -U language_kit language_kit_restore_smoke`.
Inspect expected tables and representative row counts with `psql`, then drop the
disposable database. A dump is not verified until this restore smoke test passes.

## Recovery Guidance

Before a risky local change, create and restore-test a backup. To roll back,
stop the app, preserve the current database separately, restore the last verified
dump into a clean target database, run `corepack pnpm db:migrate`, and complete
the post-release smoke checks in `docs/operational-runbook.md`.
