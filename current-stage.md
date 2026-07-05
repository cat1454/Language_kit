# Current Stage - Language Kit

Audit/update date: 2026-07-05
Branch: `feat/listening-v1-foundation`

## Stage ID

`M5_LISTENING_V1_FOUNDATION`

## Current Milestone Status

Prompt 5 - Listening v1 foundation: complete.

M4 data persistence hardening was checkpoint committed before this work started.
Preflight was clean on `feat/listening-v1-foundation`, with latest commit
`b624cb7 Complete M4 data persistence hardening`.

- Milestone 1, Prompt Builder And Schema Validation: done at a usable level.
- Milestone 2, Lesson Display And Storage: done at a usable level.
- Milestone 3, Listening Checks And Logs: done at a usable level.
- Milestone 4, Roleplay, Writing, Feedback Paste, Export Cleanup, And Data Safety: complete.
- Milestone 5, Listening v1 foundation: complete.
- Milestone 6, Dataset Export: complete for the current MVP readiness gate.

## What Is Done

- Listening input already had `audio_path`, so no duplicate DB column or migration was added. Evidence: `src/db/schema.ts:112`, `drizzle/0000_last_mongoose.sql:66`.
- Lesson detail now exposes a safe `listeningInput.audioPath` field while keeping `listeningInputId` for backward compatibility. Evidence: `app/api/lesson-packs/[id]/route.ts:34`, `app/api/lesson-packs/[id]/route.ts:35`, `app/api/lesson-packs/[id]/route.ts:37`.
- Lesson detail still explicitly maps learner payload fields and does not expose `user_id`. Evidence: `tests/integration/lesson-detail-safety-routes.test.ts:15`, `tests/integration/lesson-detail-safety-routes.test.ts:64`, `tests/integration/lesson-detail-safety-routes.test.ts:65`.
- The client detail type includes optional listening-input audio metadata. Evidence: `src/lib/lesson-data.ts:66`.
- The lesson detail client passes the audio path into the listening panel. Evidence: `src/components/lesson-detail-client.tsx:254`.
- The listening panel renders a real HTML audio element when `audioPath` exists. Evidence: `src/components/lesson-listening-panel.tsx:143`, `tests/e2e/listening-v1.spec.ts:5`.
- The real audio path uses fixed playback rate `1.0`; rate changes are reset to `1`. Evidence: `src/components/lesson-listening-panel.tsx:145`, `src/components/lesson-listening-panel.tsx:148`, `tests/e2e/listening-v1.spec.ts:23`.
- When audio is missing, the existing demo listening timer remains available and shows a non-blocking message. Evidence: `src/components/lesson-listening-panel.tsx:162`, `src/components/lesson-listening-panel.tsx:163`, `tests/e2e/listening-v1.spec.ts:32`.
- Transcript reveal behavior remains gated behind a saved listening check. Evidence: `src/components/lesson-listening-panel.tsx:197`, `tests/e2e/listening-v1.spec.ts:22`, `tests/e2e/listening-v1.spec.ts:28`.
- Listening attempt persistence remains unchanged; the public payload still omits `listeningInputId`. Evidence: `tests/e2e/listening-v1.spec.ts:28`, `tests/integration/learning-routes.test.ts:149`.
- Manual/static audio asset guidance was added. Evidence: `docs/listening-v1.md:1`, `docs/listening-v1.md:8`, `docs/listening-v1.md:18`.
- Static audio placeholder directory exists under `public/audio/lessons/`.

## What Is Missing

- No audio upload UI.
- No TTS provider integration or audio generation.
- No STT/ASR, speaking assessment, shadowing, dictation, chunk replay, multi-voice selection, speed control, local model, paid model, auth, or fine-tuning.
- Audio paths are currently assigned manually in `listening_inputs.audio_path`.

## In Scope For The Next Stage

Next safest implementation prompt: `Prompt 6 - Prompt/schema hardening`

- Keep `lesson_pack.v1` and `feedback.v1` stable unless a later prompt explicitly plans a versioned migration.
- Keep Listening v1's audio path additive and optional.
- Preserve M4 persistence, export hygiene, and `user_id` API safety.

## Prompt 8 Backlog

- Multi-voice selection
- Speed control
- Chunk replay
- Shadowing mode
- Dictation mode
- Richer audio metadata

## Out Of Scope

- TTS provider integration
- STT/ASR
- Speaking assessment
- Shadowing mode
- Dictation mode
- Chunk replay
- Multi-voice selection
- Speed control
- Audio upload UI
- Cloud audio storage
- Auth/login/sessions/permissions
- Local model or paid model integration
- Fine-tuning execution
- `lesson_pack.v1` schema changes
- `feedback.v1`/manual feedback contract changes

## Acceptance Checklist For Prompt 5

- [x] M4 checkpoint commit verified before code changes.
- [x] Worktree was clean before Prompt 5.
- [x] Branch `feat/listening-v1-foundation` used.
- [x] Existing `audio_path` field reused; no duplicate DB column added.
- [x] Lesson detail exposes safe `listeningInput.audioPath`.
- [x] `user_id` is not exposed through lesson detail.
- [x] Real audio element renders when audio path exists.
- [x] Playback speed is fixed at 1.0x.
- [x] Full-file playback only; no chunk replay, dictation, shadowing, or recording controls added.
- [x] Missing audio uses safe demo listening fallback.
- [x] Transcript remains hidden until listening attempt completion.
- [x] Listening check save still works.
- [x] `lesson_pack.v1` remains unchanged.
- [x] `feedback.v1`/manual feedback remains unchanged.
- [x] M4 persistence/export/user_id safety tests still pass.
- [x] Prompt 8 backlog captured.

## Verification Run

```text
git status --short
Result: clean before Prompt 5 code changes.

git log -1 --oneline
Result: b624cb7 Complete M4 data persistence hardening

rg -n "M4 is complete|Prompt 5 - Listening v1 foundation" current-stage.md
Result: M4 complete and Prompt 5 next-stage evidence found before this update.

corepack pnpm vitest run tests/integration/lesson-detail-safety-routes.test.ts
Result: passed. 1 file passed, 2 tests passed.

corepack pnpm vitest run tests/integration/learning-routes.test.ts
Result: passed. 1 file passed, 13 tests passed.

corepack pnpm playwright test tests/e2e/listening-v1.spec.ts --workers=1
Result: passed. 2 tests passed.

corepack pnpm check
Result: passed. File-size check passed: 60 files checked, 3 legacy exceptions frozen. Vitest: 16 passed, 1 skipped; 89 tests passed, 6 skipped.

corepack pnpm test:coverage
Result: passed. Statements 96.63%, branches 87.87%, functions 98.59%, lines 97.7%.

corepack pnpm test:all
Result: passed. Ran pnpm check and pnpm test:coverage.

corepack pnpm playwright test tests/e2e/mvp-flow.spec.ts --workers=1
Result: passed. 5 tests passed.

corepack pnpm playwright test tests/e2e/mvp-hardening.spec.ts --workers=1
Result: passed. 3 tests passed.
```

## Last Update Notes

- Prompt 5 changed only the optional audio-path lesson detail/UI/docs/test surface.
- No database migration was needed.
- Next prompt should be Prompt 6 - Prompt/schema hardening.
