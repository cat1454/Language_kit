"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Save, Square } from "lucide-react";
import { requestJson } from "@/src/lib/api-client";
import type { DataSource } from "@/src/lib/lesson-data";

export function LessonSpeakingPanel({
  lessonId,
  promptRef,
  source
}: {
  lessonId: number;
  promptRef: string;
  source: DataSource | null;
}) {
  const [transcript, setTranscript] = useState("");
  const [recordingSupported, setRecordingSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingMessage, setRecordingMessage] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setRecordingSupported(
      typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia)
    );
    return () => {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      stopTracks(streamRef.current);
    };
  }, []);

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  async function startRecording() {
    setError("");
    setRecordingMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stopTracks(streamRef.current);
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });
        if (blob.size > 0) setAudioUrl(URL.createObjectURL(blob));
        setRecording(false);
        setRecordingMessage("Recording ready for local playback. It has not been uploaded.");
      };
      recorder.start();
      setRecording(true);
      setRecordingMessage("Recording locally...");
    } catch {
      stopTracks(streamRef.current);
      streamRef.current = null;
      setError("Microphone access was not granted. You can still type a transcript.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function saveTranscript() {
    const normalized = transcript.trim();
    if (!normalized) return;
    setSaving(true);
    setError("");
    setSaveMessage("");
    try {
      const payload = {
        lessonId,
        promptType: "roleplay",
        promptRef,
        transcript: normalized
      };
      if (source === "api") {
        await requestJson("/api/speaking-attempts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else if (source === "demo") {
        saveDemoAttempt(payload);
      } else {
        throw new Error("Lesson data source is not ready.");
      }
      setSaveMessage("Transcript saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save transcript.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: "20px" }}>
      <h2>Speaking practice</h2>
      <p>Optional practice only. Say the roleplay response aloud, then type what you said.</p>
      <p className="status pending">Prompt: {promptRef}</p>
      <p className="muted">No pronunciation or fluency assessment is performed.</p>

      {recordingSupported ? (
        <div className="actions">
          {!recording ? (
            <button type="button" className="secondary icon-btn" onClick={startRecording}>
              <Mic size={16} /><span>Start local recording</span>
            </button>
          ) : (
            <button type="button" className="secondary icon-btn" onClick={stopRecording}>
              <Square size={16} /><span>Stop recording</span>
            </button>
          )}
        </div>
      ) : (
        <p className="muted">Recording is not supported here. You can still type a transcript.</p>
      )}
      {recordingMessage ? <p className="muted">{recordingMessage}</p> : null}
      {audioUrl ? <audio data-testid="local-speaking-recording" src={audioUrl} controls /> : null}

      <div className="field">
        <label htmlFor="manual-speaking-transcript">Manual speaking transcript</label>
        <textarea
          id="manual-speaking-transcript"
          value={transcript}
          onChange={(event) => {
            setTranscript(event.target.value);
            setSaveMessage("");
          }}
        />
      </div>
      <button
        type="button"
        className="icon-btn"
        onClick={saveTranscript}
        disabled={!transcript.trim() || saving}
      >
        <Save size={16} /><span>{saving ? "Saving..." : "Save transcript"}</span>
      </button>
      {saveMessage ? <p className="status accepted">{saveMessage}</p> : null}
      {error ? <p className="status rejected" role="alert">{error}</p> : null}
      <p className="muted">Recordings stay in this page session and are never uploaded.</p>
    </div>
  );
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function saveDemoAttempt(payload: {
  lessonId: number;
  promptType: string;
  promptRef: string;
  transcript: string;
}) {
  const key = "language_kit_demo_speaking_attempts";
  const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
  localStorage.setItem(key, JSON.stringify([
    ...existing,
    { ...payload, sttProvider: "manual", sttStatus: "completed", createdAt: new Date().toISOString() }
  ]));
}
