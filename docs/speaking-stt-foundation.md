# Speaking/STT Foundation

Prompt 9 adds optional speaking practice with manual transcript persistence. It
does not add speech assessment or a production speech-to-text provider.

## Privacy Behavior

- Microphone permission is requested only after the learner clicks **Start
  local recording**.
- The page never records or requests microphone access on load.
- Recorded audio remains a browser Blob URL for the current page session.
- Audio is not uploaded, written to PostgreSQL, or assigned an `audio_path`.
- Media tracks stop when recording ends or the panel unmounts.
- Manual transcript entry remains available whether recording is supported or
  permission is granted.

If audio persistence is added later, the work must include explicit consent,
retention limits, learner-visible deletion, file cleanup when database rows are
deleted, and documentation of the storage boundary before rollout.

## Manual Transcript Path

The MVP path is:

```text
optional local recording
-> learner types or edits a manual transcript
-> POST /api/speaking-attempts
-> Zod validation
-> manual transcription adapter
-> speaking_attempts row
```

The response is an explicit learner-safe projection and never includes the
single-user `user_id` placeholder or an audio path.

## STT Boundary

`src/lib/speaking-transcription.ts` defines the shared provider and status
vocabulary. Prompt 9 implements only deterministic `manual` and test-only
`mock` inputs. `future_local` reserves the contract vocabulary but does not run
a model.

A future Prompt 9.5 may spike local faster-whisper. That spike must separately
decide model installation, device requirements, process isolation, consent,
transcript retention, audio deletion, failure handling, and whether any audio
ever leaves the learner's machine.

## Data Model

`speaking_attempts` stores:

- lesson reference and single-user placeholder
- prompt type and optional prompt reference
- optional audio path reserved for a later explicitly approved workflow
- optional transcript
- nullable STT provider and required status
- created and optional updated timestamps

Prompt 9 writes no raw audio blob to PostgreSQL. Current manual saves use
`stt_provider = manual` and `stt_status = completed`.

## Explicitly Out Of Scope

- paid or cloud STT providers
- server-side or production local model execution
- automatic third-party website use
- pronunciation or fluency scoring
- realtime voice roleplay
- fine-tuning
- changes to `lesson_pack.v1` or the feedback contract
