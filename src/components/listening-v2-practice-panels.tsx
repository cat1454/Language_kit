"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { MicOff, Play, RotateCcw } from "lucide-react";
import type { LessonPackV1 } from "@/src/lib/contracts";
import type { ListeningAudioMetadata } from "@/src/lib/listening-audio-metadata";

type ChunkTiming = NonNullable<ListeningAudioMetadata["chunkTimings"]>[number];

export function hasListeningAudio(
  audioPath?: string | null,
  audioMetadata?: ListeningAudioMetadata | null
) {
  return Boolean(audioPath || audioMetadata?.variants?.some((variant) => variant.audioPath));
}

export function ListeningAudioPractice({
  lesson,
  audioPath,
  audioMetadata,
  seconds,
  onSecondsChange
}: {
  lesson: LessonPackV1;
  audioPath?: string | null;
  audioMetadata?: ListeningAudioMetadata | null;
  seconds: number;
  onSecondsChange: (seconds: number) => void;
}) {
  const variants = audioMetadata?.variants ?? [];
  const chunkTimings = audioMetadata?.chunkTimings ?? [];
  const defaultVoiceId = audioMetadata?.defaultVoiceId ?? variants[0]?.voiceId ?? "";
  const [selectedVoiceId, setSelectedVoiceId] = useState(defaultVoiceId);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunkStopMs = useRef<number | null>(null);
  const selectedVariant =
    variants.find((variant) => variant.voiceId === selectedVoiceId) ??
    variants.find((variant) => variant.voiceId === defaultVoiceId) ??
    variants[0];
  const currentAudioPath = selectedVariant?.audioPath ?? audioPath ?? null;

  useEffect(() => {
    setSelectedVoiceId(defaultVoiceId);
  }, [defaultVoiceId]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
  }, [currentAudioPath, playbackSpeed]);

  if (!currentAudioPath) return null;

  function handleTimeUpdate(event: SyntheticEvent<HTMLAudioElement>) {
    const audio = event.currentTarget;
    onSecondsChange(Math.floor(audio.currentTime));
    if (chunkStopMs.current != null && audio.currentTime * 1000 >= chunkStopMs.current) {
      audio.pause();
      chunkStopMs.current = null;
    }
  }

  function playFullAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    chunkStopMs.current = null;
    audio.currentTime = 0;
    void audio.play();
  }

  function playChunk(timing: ChunkTiming) {
    const audio = audioRef.current;
    if (!audio) return;
    chunkStopMs.current = timing.endMs;
    audio.currentTime = timing.startMs / 1000;
    void audio.play();
  }

  return (
    <>
      <div className="audio-player">
        <audio
          className="real-audio"
          controls
          data-testid="lesson-audio-player"
          key={currentAudioPath}
          onLoadedMetadata={(event) => {
            event.currentTarget.playbackRate = playbackSpeed;
          }}
          onTimeUpdate={handleTimeUpdate}
          preload="metadata"
          ref={audioRef}
          src={currentAudioPath}
        />
        <div className="actions" style={{ justifyContent: "flex-start" }}>
          <div className="field" style={{ maxWidth: "160px" }}>
            <label htmlFor="playback-speed">Playback speed</label>
            <select
              id="playback-speed"
              value={playbackSpeed}
              onChange={(event) => setPlaybackSpeed(Number(event.target.value))}
            >
              <option value={0.75}>0.75x</option>
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
            </select>
          </div>
          {variants.length > 0 ? (
            <div className="field" style={{ maxWidth: "220px" }}>
              <label htmlFor="voice-variant">Voice</label>
              <select
                id="voice-variant"
                value={selectedVariant?.voiceId ?? ""}
                onChange={(event) => setSelectedVoiceId(event.target.value)}
              >
                {variants.map((variant) => (
                  <option key={variant.voiceId} value={variant.voiceId}>{variant.label}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <div className="audio-meta">
          <span>{lesson.listening_input.recommended_voice} - {lesson.listening_input.accent}</span>
          <span>{formatTime(seconds)} / {formatTime(lesson.listening_input.duration_seconds)}</span>
        </div>
      </div>

      <div className="panel">
        <h2>Chunk replay</h2>
        {chunkTimings.length > 0 ? (
          <TimedSegmentButtons
            chunkTimings={chunkTimings}
            labelPrefix="Replay chunk"
            onPlay={playChunk}
          />
        ) : <p className="status pending">Chunk replay needs timing metadata.</p>}
      </div>

      <div className="panel">
        <h2>Shadowing practice</h2>
        {chunkTimings.length > 0 ? (
          <TimedSegmentButtons
            chunkTimings={chunkTimings}
            labelPrefix="Shadow chunk"
            onPlay={playChunk}
          />
        ) : (
          <button type="button" className="secondary icon-btn" onClick={playFullAudio}>
            <Play size={16} /><span>Shadow full audio</span>
          </button>
        )}
      </div>
    </>
  );
}

export function DictationPractice({
  checked,
  script
}: {
  checked: boolean;
  script: string;
}) {
  const [dictationDraft, setDictationDraft] = useState("");

  return (
    <div className="panel">
      <h2>Dictation practice</h2>
      <div className="field">
        <label htmlFor="dictation-draft">Dictation draft</label>
        <textarea
          id="dictation-draft"
          value={dictationDraft}
          onChange={(event) => setDictationDraft(event.target.value)}
        />
      </div>
      {checked ? (
        <div style={{ marginTop: "16px" }}>
          <h3>Dictation compare</h3>
          <p className="muted" data-testid="dictation-draft-preview">
            {dictationDraft || "No dictation draft entered."}
          </p>
          <pre className="transcript" data-testid="dictation-transcript">{script}</pre>
        </div>
      ) : null}
    </div>
  );
}

function TimedSegmentButtons({
  chunkTimings,
  labelPrefix,
  onPlay
}: {
  chunkTimings: ChunkTiming[];
  labelPrefix: "Replay chunk" | "Shadow chunk";
  onPlay: (timing: ChunkTiming) => void;
}) {
  const Icon = labelPrefix === "Shadow chunk" ? MicOff : RotateCcw;

  return (
    <div className="actions" style={{ justifyContent: "flex-start" }}>
      {chunkTimings.map((timing) => (
        <button
          type="button"
          className="secondary icon-btn"
          key={`${labelPrefix}-${timing.chunkIndex}-${timing.startMs}`}
          onClick={() => onPlay(timing)}
        >
          <Icon size={16} /><span>{labelPrefix} {timing.chunkIndex + 1}</span>
        </button>
      ))}
    </div>
  );
}

function formatTime(value: number) {
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}
