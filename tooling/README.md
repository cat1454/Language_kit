# Repository Tooling

This folder contains development-only guardrails and project-scoped agent guidance.

- `file-size-baseline.json` freezes the current oversized-file debt while all new code files are limited to 300 lines.
- `agent-skills/` contains optional project guidance distilled for Language Kit work.

Runtime code must not import files from this folder.

The full `ECC/` and `ponytail/` reference checkouts are intentionally local-only and ignored by Git. Agents must read their relevant guidance before application-code changes, as required by the root `AGENTS.md`.
