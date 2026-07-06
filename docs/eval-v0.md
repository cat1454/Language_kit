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

## Calibration Notes

Prompt 7.5 reviewed `eval/dogfood_sessions/2026-07-05-reschedule-meeting.md`.
The session recorded successful lesson prompt generation, accepted lesson JSON,
completed listening checks, preserved transcript gating, saved roleplay and
writing outputs, accepted feedback JSON, completed a retry drill, and inspected
JSONL exports.

No eval rows were added. The log did not include raw malformed JSON, a concrete
contract rejection, a named export shape gap, or a suggested row ID/reason that
would justify a deterministic model-free calibration row.
