#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is required on PATH." >&2
  exit 1
fi

output_dir="${1:-backups}"
mkdir -p "$output_dir"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
output_file="${output_dir%/}/language-kit-${timestamp}.dump"

pg_dump --format=custom --file="$output_file" "$DATABASE_URL"

echo "$output_file"
