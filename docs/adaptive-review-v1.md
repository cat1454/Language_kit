# Adaptive Review v1

Prompt 10 adds a deterministic review queue derived from existing persisted
learner practice data. It is an explainable read model, not AI ranking, spaced
repetition research, vector search, or a personalized scheduling engine.

## Review Sources

The queue uses:

- open and completed `retry_drills`
- unresolved feedback rows in `error_log`
- weak `listening_attempts`
- writing drafts and accepted writing feedback
- saved `roleplay_turns` without follow-up feedback
- manual transcript `speaking_attempts`

Lesson titles come from the existing `topics` relationship. The repository
selects explicit learner-safe fields and filters the current single-user
placeholder internally. It does not select or return `user_id`,
`speaking_attempts.audio_path`, listening audio paths, or raw database rows.

`model_outputs` is not a direct review source because it has no lesson-pack
foreign key and contains large raw prompts and responses. Accepted feedback is
already represented more safely by `error_log`, feedback-created retry drills,
and `writing_submissions.feedback_json`.

The existing dashboard summary is also not a direct item source because it is
aggregate-only and has no lesson or learner action to link to.

## Deterministic Rules

Priority is an integer from 1 to 4:

- 4 urgent: unfinished retry drills created from accepted feedback and
  high-priority unresolved feedback errors
- 3 high: weak listening checks and writing with unresolved accepted feedback
- 2 normal: lesson retry drills, writing drafts without feedback, roleplay
  responses without feedback, and manual speaking transcripts
- 1 low: completed retry drills or resolved feedback errors when included

Items sort by:

1. priority descending
2. source timestamp descending
3. stable item ID ascending

The source timestamp uses `sourceUpdatedAt`, then `createdAt`. Missing or invalid
timestamps use a deterministic zero-time sort fallback, leaving stable ID as
the tie-breaker.

Stable IDs use `<sourceType>:<persisted-row-id>`. Evidence snippets are
whitespace-normalized and capped at 180 characters.

## API

`GET /api/review-queue` accepts:

- optional positive integer `lessonId`
- optional positive integer `limit`, default 10 and maximum 25

Unknown, duplicate, malformed, zero, negative, or over-limit query parameters
return HTTP 400.

The response is:

```json
{
  "items": [],
  "summary": {
    "total": 0,
    "urgent": 0,
    "high": 0,
    "normal": 0,
    "low": 0
  }
}
```

Summary counts describe all matching derived items before the display limit is
applied.

## Dashboard Behavior

The progress dashboard shows a small **Review next** panel with priority, title,
reason, evidence snippet, action hint, and a lesson link.

The panel preserves the existing browser-only demo fallback. If the dashboard
summary loads but the review API fails, the metrics remain usable and the panel
shows a contained error message.

## Data And Contract Impact

- `lesson_pack.v1`: unchanged
- `feedback.v1` and manual feedback validation: unchanged
- database tables: unchanged
- migration: none
- lesson detail payload: unchanged
- speaking attempt payload: unchanged
- exports and eval set: unchanged
- local STT prototype: unchanged and still disconnected

No model/provider call, vector search, audio upload, audio persistence, or audio
path exposure was added.

## TDD Evidence

- RED: `79a2032 test: add adaptive review queue red coverage`
  - new unit and route tests failed because the review model did not exist
- GREEN: `7ace972 feat: add deterministic adaptive review queue`
  - focused unit, route, TypeScript, file-size, and Playwright checks passed

Future work may evaluate spaced repetition, due dates, vector memory,
notifications, and personalized scheduling. Those features require a separate
product and data design.
