# Dogfood Plan

Dogfood v0 turns the current MVP loop into repeatable evidence before model
integration or fine-tuning work begins.

## Target

- Collect 20-50 real study sessions later.
- Start with the default B1 workplace meeting lane:
  - Target language: English
  - Native language: Vietnamese
  - CEFR level: B1
  - Topic: Reschedule a meeting
  - Situation: A workplace meeting must be moved because of a scheduling conflict.
  - Session length: 30 minutes

## Session Flow

1. Generate the lesson prompt in the app.
2. Use manual AI relay and paste the returned JSON.
3. Keep accepted and rejected lesson outputs.
4. Complete listening checks, roleplay, writing, feedback, and one retry drill.
5. Export JSONL rows after the session.
6. Record only the metadata needed to understand quality and failures.

## Safety Rules

- AI output remains untrusted until validation passes.
- Bad JSON is rejected, not silently accepted.
- Manual relay remains the default.
- Do not add provider integration, fine-tuning, TTS/STT, or third-party
  automation during dogfood logging.
- Dogfood logs must avoid secrets and unnecessary personal data.

## Calibration After 20 Sessions

Review common rejection reasons, feedback quality, retry usefulness, and export
row completeness. Add or adjust eval rows only when a real dogfood failure shows
that the deterministic harness is missing a useful guard.
