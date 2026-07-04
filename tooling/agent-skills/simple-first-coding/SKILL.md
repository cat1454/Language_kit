---
name: simple-first-coding
description: "Use when coding, fixing, refactoring, or reviewing code to force the simplest correct change: read existing code first, reuse local patterns, avoid unnecessary abstractions, dependencies, and files, and verify risk with just-enough tests and security checks."
---

# Simple First Coding

Solve the problem with the smallest correct change.

Small means fewer behavior changes, fewer files, fewer dependencies, and less future maintenance. It does not mean skipping understanding, validation, security, accessibility, or tests.

## Workflow

### 1. Read First

Before editing:

- Read the files the task touches.
- Trace one real path from input to output.
- Search for existing helpers, types, tests, config, callers, and patterns with `rg`.
- For bug fixes, inspect sibling callers before changing the function.
- Prefer the repo's current style over a new local style.

If you cannot identify the real flow, do not start by writing code. Read more or ask one narrow question.

### 2. Choose The First Working Rung

Stop at the first rung that solves the task:

1. Does this need to exist? If not, skip it and say why.
2. Does the codebase already do this? Reuse it.
3. Does the standard library do this? Use it.
4. Does the platform/runtime/framework already do this? Use it.
5. Does an installed dependency already do this? Use it.
6. Can the existing code be adjusted in one small place? Do that.
7. Only then write the minimum new code.

If two rungs both work, choose the earlier rung.

### 3. Keep The Change Narrow

Default to:

- one root-cause fix over patches in many callers
- one existing file over a new file
- one existing function over a new abstraction
- deletion over addition
- boring code over clever code
- local behavior over global configuration

Do not add a dependency unless it is clearly smaller and safer than owning the code.

### 4. Abstraction Gate

Create an abstraction only when all are true:

- there are at least two real call sites now
- the repeated logic has the same meaning, not just similar shape
- the abstraction reduces code or risk today
- the name makes the behavior clearer
- the tests or callers prove the contract

Otherwise, inline it.

### 5. Dependency Gate

Before adding a package, check:

- stdlib/native/platform option
- installed dependency option
- maintenance status and license
- bundle/runtime/security cost
- whether a few clear lines would be safer

Do not add a package for one small transform, one format call, one validator, or speculative future use.

### 6. Risk Gate

Never simplify away:

- input validation at trust boundaries
- auth, authorization, or tenant isolation
- payment, money, secret, or personal-data protections
- error handling that prevents data loss
- migrations, destructive operations, or rollback paths
- accessibility basics in user-facing UI
- real hardware or external-system calibration/timing needs

If the change touches these, slow down and verify more.

### 7. Just-Enough Verification

Match verification to risk:

- Trivial one-liner: no new test unless the repo already has a natural test spot.
- Branch, loop, parser, state update, or bug fix: add or run one focused test/check.
- Shared helper, API, auth, data, or migration path: run the relevant test suite and security checks.
- Refactor: prove behavior did not change.
- If you cannot run verification, say exactly what was not run and why.

Do not claim fixed until the proving command or manual check has been rerun.

## Review Checklist

Before final response or review approval, check:

- Did I read the touched flow before editing?
- Did I search for existing helpers, tests, callers, and patterns?
- Can any new code be deleted?
- Did I add a file, dependency, abstraction, config, or layer without current evidence?
- Is the fix at the shared root cause?
- Are validation, security, accessibility, and data-loss protections intact?
- Is test scope proportional to risk?
- Did I leave unrelated code alone?
- Can I name the exact proof command or check?

## Output Style

For implementation work, report only:

- what changed
- what was intentionally skipped
- what was verified

For review work, lead with findings. If there is nothing meaningful to simplify, say: `Lean enough. Ship.`

## Anti-Patterns

Avoid:

- interface with one implementation
- factory with one product
- wrapper that only renames another wrapper
- config for a value nobody changes
- dependency for one small operation
- new service/module for one caller
- broad refactor during a narrow bug fix
- editing tests to match broken behavior
- weakening lint, type, security, or validation config to make checks pass
- top-level docs or process files for a local code change
- "future-proof" code without a current second use

## Examples

### Cache

Before: custom cache manager, TTL thread, config file, invalidation API.

After: use the language/runtime cache helper on the expensive pure function. Add TTL only when stale data is a real measured problem.

### Filter

Before: new repository abstraction and query-builder layer for one list endpoint.

After: add the filter to the existing list function and one focused test for the requested behavior.
