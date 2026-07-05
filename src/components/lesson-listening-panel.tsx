"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle, Pause, Play } from "lucide-react";
import type { LessonPackV1 } from "@/src/lib/contracts";
import type { ListeningAttempt } from "@/src/lib/lesson-data";
import {
  calculateListeningScore,
  matchesAnswerKeywords,
  matchesKeyPhrase
} from "@/src/lib/scoring";

type AttemptInput = Omit<ListeningAttempt, "id" | "lessonPackId" | "createdAt">;

export function LessonListeningPanel({
  lesson,
  initialAttempt,
  onSave,
  onComplete,
  onContinue
}: {
  lesson: LessonPackV1;
  initialAttempt?: ListeningAttempt;
  onSave: (attempt: AttemptInput) => Promise<void>;
  onComplete: (summary: string) => void;
  onContinue: () => void;
}) {
  const [gistInputs, setGistInputs] = useState(
    initialAttempt?.gistAnswers ?? lesson.while_listening.gist_questions.map(() => "")
  );
  const [detailInputs, setDetailInputs] = useState(
    initialAttempt?.detailAnswers ?? lesson.while_listening.detail_questions.map(() => "")
  );
  const [keyPhraseInputs, setKeyPhraseInputs] = useState(
    initialAttempt?.keyPhraseAnswers ?? lesson.while_listening.key_phrase_recognition.map(() => "")
  );
  const [checked, setChecked] = useState(Boolean(initialAttempt));
  const [scores, setScores] = useState({
    gist: (initialAttempt?.scoreGist ?? 0) * 100,
    detail: (initialAttempt?.scoreDetail ?? 0) * 100,
    keyPhrase: (initialAttempt?.scoreKeyPhrase ?? 0) * 100
  });
  const [replayCount, setReplayCount] = useState(initialAttempt?.replayCount ?? 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    timer.current = setInterval(() => {
      setSeconds((current) => {
        if (current >= lesson.listening_input.duration_seconds - 1) {
          setIsPlaying(false);
          return lesson.listening_input.duration_seconds;
        }
        return current + 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [isPlaying, lesson.listening_input.duration_seconds]);

  function togglePlay() {
    if (!isPlaying && seconds >= lesson.listening_input.duration_seconds) {
      setSeconds(0);
      setReplayCount((count) => count + 1);
    }
    setIsPlaying((value) => !value);
  }

  async function verify() {
    const gistCorrect = countMatches(
      gistInputs,
      lesson.while_listening.gist_questions.map((question) => question.answer),
      matchesAnswerKeywords
    );
    const detailCorrect = countMatches(
      detailInputs,
      lesson.while_listening.detail_questions.map((question) => question.answer),
      matchesAnswerKeywords
    );
    const keyPhraseCorrect = countMatches(
      keyPhraseInputs,
      lesson.while_listening.key_phrase_recognition.map((item) => item.phrase),
      matchesKeyPhrase
    );
    const calculated = calculateListeningScore({
      gistCorrect,
      gistTotal: gistInputs.length,
      detailCorrect,
      detailTotal: detailInputs.length,
      keyPhraseCorrect,
      keyPhraseTotal: keyPhraseInputs.length
    });
    const missedDetails = lesson.while_listening.detail_questions
      .filter((question, index) => !matchesAnswerKeywords(detailInputs[index] ?? "", question.answer))
      .map((question) => question.answer);

    setSaving(true);
    setError("");
    try {
      await onSave({
        gistAnswers: gistInputs,
        detailAnswers: detailInputs,
        keyPhraseAnswers: keyPhraseInputs,
        replayCount,
        scoreGist: calculated.gist,
        scoreDetail: calculated.detail,
        scoreKeyPhrase: calculated.keyPhrase,
        missedDetails
      });
      setScores({
        gist: calculated.gist * 100,
        detail: calculated.detail * 100,
        keyPhrase: calculated.keyPhrase * 100
      });
      setChecked(true);
      onComplete(buildSummary(gistInputs, detailInputs, calculated.overall, replayCount));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save listening attempt.");
    } finally {
      setSaving(false);
    }
  }

  const allAnswered = [...gistInputs, ...detailInputs, ...keyPhraseInputs].every(
    (answer) => answer.trim().length > 0
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="audio-player">
        <div className="audio-controls">
          <button type="button" className="play-btn" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <div className="waveform" aria-hidden="true">
            {Array.from({ length: 30 }, (_, index) => (
              <div className={`wave-bar ${isPlaying ? "active" : ""}`} key={index} />
            ))}
          </div>
        </div>
        <div className="audio-meta">
          <span>{lesson.listening_input.recommended_voice} · {lesson.listening_input.accent}</span>
          <span>{formatTime(seconds)} / {formatTime(lesson.listening_input.duration_seconds)}</span>
        </div>
      </div>

      <QuestionGroup title="Gist comprehension" questions={lesson.while_listening.gist_questions} values={gistInputs} setValues={setGistInputs} checked={checked} />
      <QuestionGroup title="Detail comprehension" questions={lesson.while_listening.detail_questions} values={detailInputs} setValues={setDetailInputs} checked={checked} />

      <div className="panel">
        <h2>Key phrase recognition</h2>
        {lesson.while_listening.key_phrase_recognition.map((item, index) => (
          <div className="field" key={item.phrase} style={{ marginBottom: "14px" }}>
            <label htmlFor={`key-phrase-${index}`}>Type the phrase you heard</label>
            <input id={`key-phrase-${index}`} value={keyPhraseInputs[index] ?? ""} disabled={checked} onChange={(event) => updateAt(setKeyPhraseInputs, keyPhraseInputs, index, event.target.value)} />
            {checked ? <p className="muted">Expected: {item.phrase} — {item.meaning}</p> : null}
          </div>
        ))}
      </div>

      {checked ? (
        <div className="panel" style={{ borderLeft: "3px solid var(--accent)" }}>
          <h2>Unlocked Transcript</h2>
          <pre className="transcript">{lesson.listening_input.script}</pre>
        </div>
      ) : <p className="status pending">🔒 Complete all listening checks to unlock the transcript.</p>}

      {error ? <p className="status rejected" role="alert">{error}</p> : null}
      <div className="actions" style={{ justifyContent: "space-between" }}>
        {!checked ? (
          <button type="button" className="icon-btn" onClick={verify} disabled={!allAnswered || saving}>
            <CheckCircle size={16} /><span>{saving ? "Saving..." : "Verify & save"}</span>
          </button>
        ) : (
          <div className="actions">
            <span className="badge level-b1">Gist {scores.gist}%</span>
            <span className="badge level-b1">Detail {scores.detail}%</span>
            <span className="badge level-b1">Phrases {scores.keyPhrase}%</span>
          </div>
        )}
        <button type="button" className="secondary icon-btn" onClick={onContinue} disabled={!checked}>
          <ArrowRight size={16} /><span>Proceed to Roleplay</span>
        </button>
      </div>
    </div>
  );
}

function QuestionGroup({
  title,
  questions,
  values,
  setValues,
  checked
}: {
  title: string;
  questions: Array<{ question: string; answer: string }>;
  values: string[];
  setValues: (values: string[]) => void;
  checked: boolean;
}) {
  return (
    <div className="panel">
      <h2>{title}</h2>
      {questions.map((item, index) => (
        <div className="field" key={item.question} style={{ marginBottom: "14px" }}>
          <label htmlFor={`${title}-${index}`}>{item.question}</label>
          <textarea
            id={`${title}-${index}`}
            value={values[index] ?? ""}
            disabled={checked}
            onChange={(event) => updateAt(setValues, values, index, event.target.value)}
          />
          {checked ? <p className="muted">Suggested answer: {item.answer}</p> : null}
        </div>
      ))}
    </div>
  );
}

function updateAt(
  setValues: (values: string[]) => void,
  values: string[],
  index: number,
  value: string
) {
  const next = [...values];
  next[index] = value;
  setValues(next);
}

function countMatches(
  values: string[],
  expected: string[],
  matcher: (value: string, expected: string) => boolean
) {
  return values.filter((value, index) => matcher(value, expected[index] ?? "")).length;
}

function formatTime(value: number) {
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

function buildSummary(gist: string[], detail: string[], overall: number, replays: number) {
  return `Gist answers: ${gist.join(" | ")}; Detail answers: ${detail.join(" | ")}; score: ${overall}; replays: ${replays}`;
}
