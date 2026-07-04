# Language Kit Engineering Rules

These rules apply to the whole repository.

## Required local context

Before planning, editing, refactoring, or reviewing application code:

1. Read this `AGENTS.md` completely.
2. Read `ECC/AGENTS.md` and the ECC rule or skill relevant to the task.
3. Read `ponytail/AGENTS.md` and the Ponytail guidance relevant to the task.
4. Then inspect the real Language Kit implementation path before proposing a change.

`ECC/` and `ponytail/` are local reference checkouts, not Language Kit source. They must remain ignored by Git and excluded from the Docker build context. Do not import runtime code from them or copy their package dependencies into this project.

If either local checkout is missing, do not silently skip this requirement. Limit work to read-only repository inspection, report the missing context, and restore or request restoration before modifying application code. Documentation-only repository housekeeping may proceed when it does not depend on those references.

## Product invariants

- Keep the learning order: listening -> chunk mining -> roleplay -> writing -> feedback -> retry -> progress.
- The application owns workflow and data. AI output is untrusted input and must pass the Zod contracts before persistence.
- Keep `lesson_pack.v1` backward compatible unless a schema migration is explicitly planned.
- Manual AI relay remains the default MVP path. Do not automate third-party AI websites without an approved integration.
- Never reveal the full listening transcript before the learner completes the listening checks.

## Repository boundaries

- `app/`: Next.js pages and thin route handlers.
- `src/components/`: client UI and interaction orchestration.
- `src/lib/`: framework-independent contracts, prompts, scoring, and exports.
- `src/db/`: database schema, connection, and repository operations.
- `src/demo/`: deterministic demo data used by the product and tests.
- `tests/`: unit, integration, and end-to-end behavior.
- `docs/`: product, architecture, and research documents.
- `tooling/`: repository checks and agent guidance; never import it into runtime code.

Do not add vendored repositories, generated reports, caches, or package stores to the project tree. Avoid new top-level folders when an existing boundary fits.

## File size and decomposition

- New code files must not exceed 300 physical lines.
- Existing oversized files are recorded in `tooling/file-size-baseline.json`; they may shrink but must never grow beyond their recorded baseline.
- When touching an oversized file, extract one cohesive responsibility when practical and lower or remove its baseline entry.
- Split by behavior or domain responsibility, not arbitrary line ranges.
- Do not bypass the check with minified code, compressed JSX, generated wrappers, or an expanded baseline without an explicit reason.
- Run `pnpm check:file-size` after moving or adding code.

## Code rules

- Prefer the smallest behavior-preserving change and reuse existing contracts and helpers.
- Keep route handlers focused on request parsing, validation, status codes, and repository calls.
- Keep database access in `src/db`; UI code must not query PostgreSQL directly.
- Production code must not import from `tests/`.
- Validate external input at the boundary and preserve actionable error details.
- Do not add a dependency when the platform or a small local helper already solves the problem clearly.
- Never commit secrets. Document configuration in `.env.example` only.

## Verification

- Run `pnpm check` before a preliminary commit.
- Run `pnpm build` for routing, configuration, dependency, or production-bound changes.
- Run `pnpm test:e2e` when the learner flow or visible UI behavior changes.
- PostgreSQL integration tests remain opt-in and must use a disposable test database.

Report separately what was changed locally, verified locally, committed, and pushed.
