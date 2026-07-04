# Test And Acceptance Plan

## Test Topic

Use one default test topic across MVP checks:

```text
Target language: English
Native language: Vietnamese
CEFR level: B1
Topic: Reschedule a meeting
Situation: A workplace meeting must be moved because of a scheduling conflict.
Session length: 30 minutes
```

## Scenario 1: Generate A B1 Workplace Lesson Pack

Steps:

1. Enter the test topic into the prompt builder.
2. Generate the lesson-pack prompt.
3. Copy the prompt into a manual AI tool.
4. Paste the returned JSON into the app.
5. Validate the JSON.

Acceptance:

- prompt includes target language, native language, CEFR level, topic, situation, and session length
- output is accepted only if it matches `lesson_pack.v1`
- listening comes before roleplay and writing
- lesson includes gist questions, detail questions, key phrase recognition, chunks, roleplay, writing, rubric, and retry drills
- full transcript is not shown to the learner before listening checks

## Scenario 2: Reject And Repair Invalid JSON

Steps:

1. Paste an invalid AI response.
2. Run validation.
3. Confirm the app rejects it with a reason.
4. Generate a repair prompt.
5. Paste repaired JSON.
6. Validate again.

Acceptance:

- invalid JSON is not silently accepted
- rejection reason is stored
- repair prompt includes the schema and broken response
- repaired output is accepted only after validation passes
- original broken output remains stored in `model_outputs`

## Scenario 3: Complete Listening To Retry Cycle

Steps:

1. Open an accepted lesson pack.
2. Complete gist, detail, and key phrase listening checks.
3. Save replay count and missed details.
4. Complete text roleplay.
5. Complete writing task.
6. Generate feedback prompt.
7. Paste feedback JSON.
8. Store error log items.
9. Complete one retry drill.

Acceptance:

- listening attempt is saved
- roleplay response is saved
- writing submission is saved
- feedback scores are saved
- error log includes evidence, correction, reason, and retry priority
- retry drill is linked to the source error
- dashboard reflects completed topic, error type, and retry completion

## Scenario 4: Dataset Export

Steps:

1. Complete at least one lesson cycle.
2. Export JSONL datasets.
3. Inspect sample rows.

Acceptance:

- `lesson_generation_sft.jsonl` includes prompt and accepted lesson JSON
- `feedback_scoring_sft.jsonl` includes learner attempt and feedback JSON
- `error_classification.jsonl` includes error evidence and type
- `retry_generation_sft.jsonl` includes source error and retry drill
- `json_repair_sft.jsonl` includes broken response and repaired JSON when available

## Manual QA Checklist Before Coding Starts

- Product docs agree that listening comes before roleplay and writing.
- MVP scope excludes realtime voice, fine-tuning, mobile, gamification, and teacher marketplace.
- AI execution policy is free relay first, local model second, paid API last.
- `lesson_pack.v1` appears consistently across docs.
- The storage model preserves raw prompt, raw output, validated JSON, source mode, accepted/rejected status, and rejection reason.
- Test scenarios use the same default topic.
- No doc requires paid APIs for the core MVP.

## Source Trace

- Sample topic flow, logs, rubric, and anti-bloat checklist: `research/listening-first-language-practice.md`
- Completion criteria, schema validation, repair prompt, and export requirements: `research/budget-constrained-architecture.md`
