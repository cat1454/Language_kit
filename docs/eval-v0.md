# Eval v0

Eval v0 is a deterministic smoke/regression harness for Language Kit contract
and export readiness. It is not a model benchmark and it does not call any AI
provider.

## What It Checks

- `eval/eval_set_v0.jsonl` is valid one-object-per-line JSONL.
- Eval rows use known task types, sources, fixtures, mutations, and check names.
- Lesson rows run through `parseAiJson()` and `validateLessonPack()`.
- Feedback rows run through `parseManualFeedbackJson()` and `validateFeedback()`.
- Export rows run through the existing export builders and `formatJsonl()`.
- Accepted/rejected status, rejection reasons, raw responses, parsed JSON when
  expected, source metadata, and useful rejected-output fields stay present.

AI output is still untrusted until validation passes. Bad JSON remains rejected,
not silently accepted.

## Command

```text
corepack pnpm eval:v0
```

`eval:v0` uses Vitest instead of a custom TypeScript runner so the repo does not
need a new dependency.

## Boundaries

- Manual relay remains the default path.
- No model provider integration was added.
- No fine-tuning was added.
- No TTS/STT was added.
- No third-party AI website automation was added.
- No `lesson_pack.v1` or `feedback.v1` contract change was added.
