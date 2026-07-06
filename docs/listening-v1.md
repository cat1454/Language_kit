# Listening V1

Listening v1 supports one optional audio file path for each lesson listening
input. The lesson contract stays `lesson_pack.v1`; audio is operational lesson
metadata, not AI-generated JSON.

## Audio Files

Place manually prepared audio files under:

```text
public/audio/lessons/
```

Use web paths in the database:

```text
/audio/lessons/<lesson-id>.mp3
```

For now, set `listening_inputs.audio_path` manually with a trusted database
tool or SQL after adding the file. If `audio_path` is null, the learner keeps
the existing demo listening timer.

## Playback Scope

- One audio path per listening input.
- One default voice conceptually; no voice picker.
- Playback speed is fixed at 1.0x.
- The full audio file is played; no chunk replay or waveform editing.
- The transcript remains hidden until the listening check is saved.

## Deferred

- TTS provider integration
- STT or ASR
- Speaking assessment
- Shadowing mode
- Dictation mode
- Chunk replay
- Multi-voice selection
- Speed control
- Richer audio metadata
