"use client";

import { useState } from "react";
import { ClipboardCheck, Copy } from "lucide-react";
import type { FeedbackV1, LessonPackV1 } from "@/src/lib/contracts";
import { parseAiJson, validateFeedback } from "@/src/lib/contracts";
import { buildFeedbackPrompt, buildRepairPrompt } from "@/src/lib/prompts";
import { calculateWritingReadinessScore } from "@/src/lib/scoring";

export function LessonWritingPanel({
  lesson,
  roleplayResponses,
  listeningSummary,
  onSaveFeedback
}: {
  lesson: LessonPackV1;
  roleplayResponses: string[];
  listeningSummary: string;
  onSaveFeedback: (prompt: string, rawAiOutput: string) => Promise<FeedbackV1>;
}) {
  const [writingInput, setWritingInput] = useState("");
  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [feedbackPrompt, setFeedbackPrompt] = useState("");
  const [rawFeedback, setRawFeedback] = useState("");
  const [feedback, setFeedback] = useState<FeedbackV1 | null>(null);
  const [repairPrompt, setRepairPrompt] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  function updateWriting(value: string) {
    setWritingInput(value);
    setFeedbackPrompt("");
    setReadinessScore(null);
    setFeedback(null);
    setRepairPrompt("");
    setStatus("");
  }

  function prepareFeedback() {
    const usedChunks = lesson.writing_task.target_chunks_to_use.filter((chunk) =>
      checkChunkUsed(writingInput, chunk)
    ).length;
    const matchedConstraints = lesson.writing_task.constraints.filter((constraint) =>
      checkConstraint(writingInput, constraint)
    ).length;
    setReadinessScore(calculateWritingReadinessScore({
      usedChunks,
      totalChunks: lesson.writing_task.target_chunks_to_use.length,
      matchedConstraints,
      totalConstraints: lesson.writing_task.constraints.length
    }));
    setFeedbackPrompt(buildFeedbackPrompt({
      lessonPack: lesson,
      roleplayResponses,
      writingDraft: writingInput,
      listeningSummary: listeningSummary || "No saved listening summary available."
    }));
    setStatus("Feedback prompt ready. Copy it to your AI tool, then paste JSON below.");
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(feedbackPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setStatus("Clipboard access failed. Select and copy the prompt manually.");
    }
  }

  async function validateAndSave() {
    const json = parseAiJson(rawFeedback);
    if (!json.success) {
      rejectFeedback(json.errors, json.rejectionReason ?? "invalid_json");
      return;
    }
    const validated = validateFeedback(json.data);
    if (!validated.success) {
      rejectFeedback(validated.errors, validated.rejectionReason ?? "missing_required_section");
      return;
    }

    setSaving(true);
    setStatus("");
    setRepairPrompt("");
    try {
      setFeedback(await onSaveFeedback(feedbackPrompt, rawFeedback));
      setStatus("Feedback saved.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Failed to save feedback.");
    } finally {
      setSaving(false);
    }
  }

  function rejectFeedback(errors: string[], reason: string) {
    setStatus(`Feedback rejected: ${reason}`);
    setRepairPrompt(buildRepairPrompt({
      brokenResponse: rawFeedback,
      validationErrors: errors,
      expectedSchemaName: "feedback.v1"
    }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="panel">
        <h2>Writing Prompt</h2>
        <p style={{ fontWeight: 600 }}>{lesson.writing_task.task}</p>
        <div className="split" style={{ margin: "20px 0" }}>
          <Checklist title="Constraints" items={lesson.writing_task.constraints} isMet={(item) => checkConstraint(writingInput, item)} />
          <Checklist title="Target chunks" items={lesson.writing_task.target_chunks_to_use} isMet={(item) => checkChunkUsed(writingInput, item)} />
        </div>
        <div className="field">
          <label htmlFor="writingInput">Your writing solution</label>
          <textarea id="writingInput" value={writingInput} disabled={Boolean(feedback)} onChange={(event) => updateWriting(event.target.value)} style={{ minHeight: "150px" }} />
        </div>
        <div className="actions">
          <button type="button" className="icon-btn" disabled={!writingInput.trim() || Boolean(feedback)} onClick={prepareFeedback}>
            <ClipboardCheck size={16} /><span>Prepare feedback prompt</span>
          </button>
          {readinessScore !== null ? <span className="badge level-b1">Draft readiness: {readinessScore}/100</span> : null}
        </div>
      </div>

      {feedbackPrompt ? (
        <div className="panel" data-testid="feedback-relay">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Manual Feedback Relay</h2>
            <button type="button" className="secondary icon-btn" onClick={copyPrompt}>
              <Copy size={15} /><span>{copied ? "Copied" : "Copy prompt"}</span>
            </button>
          </div>
          <pre className="prompt-preview" data-testid="feedback-prompt">{feedbackPrompt}</pre>
          <div className="field" style={{ marginTop: "16px" }}>
            <label htmlFor="rawFeedback">Feedback JSON response</label>
            <textarea id="rawFeedback" value={rawFeedback} onChange={(event) => setRawFeedback(event.target.value)} disabled={Boolean(feedback)} placeholder="Paste feedback JSON here..." />
          </div>
          <button type="button" className="icon-btn" onClick={validateAndSave} disabled={!rawFeedback.trim() || saving || Boolean(feedback)}>
            <ClipboardCheck size={16} /><span>{saving ? "Saving..." : "Validate and save feedback"}</span>
          </button>
          {status ? <p className={`status ${feedback ? "accepted" : "pending"}`} role="status">{status}</p> : null}
          {repairPrompt ? <pre className="prompt-preview" data-testid="feedback-repair-prompt">{repairPrompt}</pre> : null}
        </div>
      ) : null}

      {feedback ? <FeedbackResult feedback={feedback} /> : null}
    </div>
  );
}

function Checklist({ title, items, isMet }: { title: string; items: string[]; isMet: (item: string) => boolean }) {
  return (
    <div>
      <h3>{title}</h3>
      <div className="constraint-list">
        {items.map((item) => {
          const met = isMet(item);
          return (
            <div className={`constraint-item ${met ? "checked" : ""}`} key={item}>
              <span className="bullet" />
              <span>{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackResult({ feedback }: { feedback: FeedbackV1 }) {
  return (
    <div
      className="panel"
      style={{ borderLeft: "3px solid var(--accent)" }}
      data-testid="feedback-result"
    >
      <h2>Validated Feedback</h2>
      <div className="metric-grid">
        {Object.entries(feedback.scores).map(([name, score]) => (
          <div className="metric" key={name}>
            <span>{name.replaceAll("_", " ")}</span>
            <strong>{Math.round(score * 100)}</strong>
          </div>
        ))}
      </div>
      <h3>What went well</h3>
      <ul>
        {feedback.positive_notes.map((note) => <li key={note}>{note}</li>)}
      </ul>
      <h3>Corrections</h3>
      {feedback.error_log_items.map((item) => (
        <div className="panel" key={`${item.type}-${item.evidence}`}>
          <strong>{item.type}</strong>
          <p><s>{item.evidence}</s></p>
          <p>{item.correction}</p>
          <p className="muted">{item.why_it_matters}</p>
        </div>
      ))}
    </div>
  );
}

function checkConstraint(textValue: string, constraint: string) {
  const text = textValue.toLocaleLowerCase();
  const lower = constraint.toLocaleLowerCase();
  if (lower.includes("polite")) return ["please", "sorry", "would", "could"].some((word) => text.includes(word));
  const keywords = lower.split(/\s+/).filter((word) => word.length > 3);
  return keywords.some((word) => text.includes(word));
}

function checkChunkUsed(textValue: string, phrase: string) {
  const text = textValue.toLocaleLowerCase();
  const normalized = phrase.toLocaleLowerCase().replace(/[\p{P}\p{S}]+/gu, " ").trim();
  if (text.includes(normalized)) return true;
  return normalized.split(/\s+/).filter((word) => word.length > 3 && text.includes(word)).length >= 2;
}
