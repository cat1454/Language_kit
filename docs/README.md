# Web MVP Documentation Pack

This documentation pack prepares the project for coding a low-cost personal AI language practice Web MVP.

The MVP is not a general language-learning app. It is a structured learning system where the app owns workflow, data, validation, logs, retry drills, and progress measurement. AI systems only generate structured lesson and feedback outputs that the app validates and stores.

## Source Documents

- `research/listening-first-language-practice.md`
- `research/budget-constrained-architecture.md`

## Reading Order

1. `00-product-brief.md` - product goal, target learner, and non-goals.
2. `01-mvp-scope.md` - what the Web MVP must and must not include.
3. `02-learning-flow.md` - the learning loop and why listening comes first.
4. `03-ai-execution-modes.md` - free relay, local model, and paid fallback modes.
5. `04-data-contracts.md` - JSON contracts for lesson packs and feedback.
6. `05-data-model.md` - storage model for implementation.
7. `06-mvp-build-plan.md` - build milestones.
8. `07-test-and-acceptance-plan.md` - pre-code acceptance scenarios.

Release and operations references:

- `release-readiness.md` - release scope, test matrix, and checklists.
- `security-privacy-review.md` - local MVP data and privacy boundaries.
- `operational-runbook.md` - setup, backup/restore, rollback, and smoke checks.

## MVP Intent

Build the smallest useful web system that can:

- generate strict AI prompts from learner inputs
- let the learner copy prompts into free AI tools
- accept pasted JSON responses
- validate, repair, store, and display lesson packs
- run a listening-first learning flow
- collect listening, roleplay, writing, feedback, and retry data
- export training-ready JSONL datasets later

## Documentation Boundary

This pack intentionally does not define UI styling, framework choice, deployment target, auth, billing, realtime voice, or fine-tuning implementation. Those choices come after the learning loop and data contracts are stable.

## Source Trace

- Listening-first product flow: `research/listening-first-language-practice.md`
- Low-cost AI execution and schema architecture: `research/budget-constrained-architecture.md`
