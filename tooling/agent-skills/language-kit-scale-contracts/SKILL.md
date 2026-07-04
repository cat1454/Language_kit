---
name: language-kit-scale-contracts
description: Use when planning, implementing, reviewing, or expanding Language Kit features so scale-up work preserves the listening-first MVP loop, lesson_pack.v1 data contract, JSONL exports, manual free-AI relay default, and staged growth from MVP core to learning, AI execution, voice, and product expansion.
---

# Language Kit Scale Contracts

Use this skill as the scale-up contract for Language Kit. Every new feature must make the learning system stronger without turning the MVP into a broad language-learning platform too early.

## Source Files

Read the relevant source docs before changing scope or implementation:

- `../../../docs/00-product-brief.md` for product goal, target learner, core loop, and non-goals.
- `../../../docs/01-mvp-scope.md` for MVP scope, completion criteria, and out-of-scope guardrails.
- `../../../docs/02-learning-flow.md` for the listening-first learning order.
- `../../../docs/03-ai-execution-modes.md` for manual relay, local model, and paid API policy.
- `../../../docs/04-data-contracts.md` for `lesson_pack.v1`, feedback JSON, validation, and rejection reasons.
- `../../../docs/05-data-model.md` for storage tables and export datasets.
- `../../../docs/06-mvp-build-plan.md` for milestone order.
- `../../../docs/07-test-and-acceptance-plan.md` for acceptance scenarios.

## Scale Rule

Classify every requested feature into one scale tier before planning or implementation:

1. `MVP Core`: prompt builder, copy/paste AI relay, JSON validation and repair, lesson display, storage, listening checks, roleplay, writing, feedback, error log, retry drills, dashboard, JSONL export.
2. `Learning Expansion`: more topics, better progress dashboard, chunk reuse tracking, retry quality, spaced review, richer rubrics.
3. `AI Execution Expansion`: local model mode, paid API fallback, provider comparison, gold-standard examples.
4. `Voice Expansion`: local TTS, audio upload, ASR, voice capture, turn-by-turn voice roleplay.
5. `Product Expansion`: auth, multi-user accounts, teacher mode, class management, billing, marketplace, subscriptions.

Implement or propose a later tier only when earlier required MVP acceptance is explicit. If acceptance is missing, define the missing acceptance first.

## Feature Gate

For every new feature, state these before building:

- User goal: the learner or operator outcome the feature serves.
- Learning-loop fit: where it sits in `topic -> listening -> chunk mining -> roleplay -> writing -> feedback -> error log -> retry -> progress`.
- User flow: the smallest path that proves the behavior.
- Data stored: tables or fields affected, including raw and normalized AI outputs when relevant.
- Acceptance scenario: how the default test topic proves it works.
- Non-goals: nearby features that should stay out of the change.

Reject or defer features that do not improve the learning loop, data loop, or scale readiness.

## Data Gate

Preserve the app as the source of truth:

- Keep `lesson_pack.v1` stable unless the user explicitly asks for a schema version migration.
- Keep all AI backends behind the same JSON contract.
- Validate every AI output before accepting it.
- Store raw prompt, raw response, parsed JSON, accepted/rejected status, source mode, provider or site, model name when known, and rejection reason.
- Keep accepted and rejected outputs in `model_outputs`.
- Preserve JSONL export paths: `lesson_generation_sft.jsonl`, `feedback_scoring_sft.jsonl`, `error_classification.jsonl`, `retry_generation_sft.jsonl`, and `json_repair_sft.jsonl`.
- Do not reveal the full listening transcript in the learner UI before listening checks are completed.

## Architecture Gate

Use this order for AI execution:

```text
manual free-AI relay
-> local model
-> paid API fallback
```

Manual free-AI relay remains the default MVP path. Do not automate free AI websites unless their terms explicitly allow automation.

Add later capabilities only behind clear gates:

- Add local model mode only after manual relay works with `lesson_pack.v1` validation and storage.
- Add paid APIs only as optional fallback, premium workflow, teacher workflow, gold-standard evaluation, or final quality review.
- Add TTS or audio upload before ASR or realtime voice roleplay.
- Add ASR only after listening attempts and logs exist.
- Add teacher mode, auth, billing, or marketplace only after the single-learner MVP loop and exports are working.

## Acceptance Gate

Use this default test topic for MVP and scale-up checks:

```text
Target language: English
Native language: Vietnamese
CEFR level: B1
Topic: Reschedule a meeting
Situation: A workplace meeting must be moved because of a scheduling conflict.
Session length: 30 minutes
```

A feature is not done until it can be checked against at least one relevant scenario:

- Generate and validate a B1 workplace lesson pack.
- Reject invalid JSON, create a repair prompt, and accept only repaired valid JSON.
- Complete the cycle from listening checks to retry drill.
- Export useful JSONL rows after at least one completed lesson cycle.

## Scale-Up Response Contract

When responding to a scale-up request:

- Name the scale tier.
- Say whether required earlier-tier acceptance exists or must be defined first.
- Keep the first implementation path narrow.
- Preserve listening before roleplay and writing.
- Preserve manual relay as the default until local or paid modes are explicitly gated.
- Mention any affected schema, storage, export, or validation contract.
- Include a focused acceptance check using the default test topic.

## Avoid

- Building realtime voice before text and listening logs work.
- Adding fine-tuning before enough accepted lesson packs, feedback examples, and labeled errors exist.
- Adding teacher dashboards before the single-learner MVP loop works.
- Adding auth, subscriptions, billing, or marketplace to the core MVP.
- Adding a paid API dependency for core use.
- Changing the lesson schema to fit one provider.
- Treating AI chat as the source of truth instead of the app.
