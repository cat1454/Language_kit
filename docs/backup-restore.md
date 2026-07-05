# Backup And Restore

Language Kit stores personal learning data. Do not commit real database backups to a public repository.

## Create A Local Backup

Set `DATABASE_URL`, then run:

```bash
./scripts/backup-db.sh
```

The script requires `pg_dump` on `PATH`, writes to `backups/` by default, and includes a UTC timestamp in the filename.

To choose a different local output directory:

```bash
./scripts/backup-db.sh /path/to/backup-dir
```

This prompt does not automate cloud upload or backup encryption.

## Restore A Backup

Create or choose the target PostgreSQL database, set `DATABASE_URL` to that target, then run:

```bash
pg_restore --clean --if-exists --dbname "$DATABASE_URL" backups/language-kit-YYYYMMDDTHHMMSSZ.dump
```

For a safer dry run, restore into a disposable database first and inspect the row counts before replacing any active database.
