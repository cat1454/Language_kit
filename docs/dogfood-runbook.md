# Dogfood Runbook

Use this runbook to collect real dogfood evidence for Prompt 7.5 calibration.
Do not fabricate sessions, AI outputs, learner writing, or feedback JSON.

## Before A Session

1. Start from the default B1 workplace meeting lane unless the task says otherwise.
2. Use manual AI relay only.
3. Keep `lesson_pack.v1` and `feedback.v1` validation unchanged.
4. Create a session log template:
   `corepack pnpm dogfood:new reschedule-meeting`.
5. The generated session file is named with a date and short topic slug, for example:
   `2026-07-05-reschedule-meeting.md`.

## During A Session

Record real evidence only:

- accepted or rejected lesson JSON status
- rejection reason if the app rejected lesson JSON
- accepted or rejected feedback JSON status
- rejection reason if the app rejected feedback JSON
- whether transcript gating behaved correctly
- whether exports included the expected metadata
- short notes about UX issues that affected the learner flow

Do not paste secrets, private messages, credentials, or unnecessary personal
details into session logs.

For an assisted run, use:

```text
corepack pnpm dogfood:assist
```

The helper opens a Playwright browser, fills the default B1 workplace meeting
lane, and stops at the generated lesson prompt. Complete the real manual relay
and practice session yourself, then answer the terminal prompts so the helper
can write only your real yes/no evidence into the session log.

## After A Session

Classify each issue as one of:

- `lesson_prompt_json_invalid`
- `lesson_contract_invalid`
- `feedback_json_invalid`
- `feedback_contract_invalid`
- `export_shape_gap`
- `listening_v1_audio_gap`
- `transcript_gating_issue`
- `learner_flow_ux_issue`
- `dogfood_note_not_eval_actionable`

Add or adjust eval rows only when a real issue is deterministic, model-free, and
does not require changing `lesson_pack.v1` or `feedback.v1`.

If `Add eval seed` is `yes`, also fill `Suggested eval row ID` and `Short
reason`. Without a concrete ID/reason and real raw evidence or a named export
gap, the session is useful dogfood evidence but not enough to add an eval row.

## Local Checks

Use `corepack pnpm dogfood:check` after a real session log is filled in. The
check intentionally fails when the directory contains only `.gitkeep` or blank
templates, because Prompt 7.5 calibration needs real evidence. When real logs
are present, it runs `eval:v0`.
