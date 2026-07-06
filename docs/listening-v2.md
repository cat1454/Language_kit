# Listening V2

Listening v2 is an interaction-only upgrade on Listening v1. It keeps manually
prepared/static audio as the workflow and does not add TTS, STT, recording,
speaking assessment, model calls, or third-party website automation.

## Audio Metadata

Listening v2 stores optional app metadata on `listening_inputs` in
`audio_metadata_json`. This is storage/UI metadata, not part of
`lesson_pack.v1`, and lessons with only `audio_path` continue to load.

Supported metadata:

```json
{
  "defaultVoiceId": "default",
  "variants": [
    {
      "voiceId": "default",
      "label": "Default voice",
      "audioPath": "/audio/lessons/example.mp3"
    }
  ],
  "chunkTimings": [
    {
      "chunkIndex": 0,
      "startMs": 0,
      "endMs": 5000
    }
  ],
  "durationMs": 65000
}
```

Malformed metadata is ignored by the lesson detail API so the learner detail
view falls back safely.

## Playback Scope

- Speed control is client-side `HTMLAudioElement.playbackRate` only.
- Allowed playback speeds are `0.75x`, `1.0x`, and `1.25x`.
- Voice variants require manually supplied audio paths in metadata.
- Variant selection swaps the audio source; it does not generate or upload audio.
- Chunk replay requires `chunkTimings` metadata and seeks within the same static audio file.
- When chunk timings are missing, the UI shows: `Chunk replay needs timing metadata.`
- Listening v1 fallback remains available when no audio path or variant audio path exists.

## Practice Modes

Dictation practice is local UI state. The learner can type what they hear before
the listening checks are complete, but transcript comparison is available only
after the listening attempt is saved.

Shadowing practice uses the existing audio player. It does not request a
microphone, record audio, run STT/ASR, or produce pronunciation scores. If chunk
timings exist, shadowing can target a chunk; otherwise it uses full-audio
shadowing.

## Deferred

Prompt 9 remains the Speaking/STT integration stage. Listening v2 intentionally
does not implement:

- TTS provider integration
- automatic audio generation
- STT or ASR
- microphone recording
- speaking/pronunciation assessment
- AI provider, local model, or paid model integration
