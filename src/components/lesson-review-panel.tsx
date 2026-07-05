"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { RetryDrill } from "@/src/lib/lesson-data";

export function LessonReviewPanel({
  drills,
  onComplete
}: {
  drills: RetryDrill[];
  onComplete: (drillId: number, answer: string) => Promise<void>;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function submit(drillId: number) {
    const answer = answers[drillId]?.trim();
    if (!answer) return;
    setSavingId(drillId);
    setError("");
    try {
      await onComplete(drillId, answer);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to complete retry drill.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="section-header">
        <h2>Review & Retry Drills</h2>
        <p>Turn validated feedback into another attempt.</p>
      </div>
      {error ? <p className="status rejected" role="alert">{error}</p> : null}
      {drills.length === 0 ? <p className="status pending">No retry drills yet.</p> : null}
      {drills.map((drill) => {
        const completed = Boolean(drill.completedAt);
        return (
          <div className="panel" key={drill.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>{drill.instruction}</h3>
              {completed ? <span className="badge level-b1">Completed</span> : null}
            </div>
            <p className="muted">Practice item: {drill.items[0]}</p>
            <div className="field">
              <label htmlFor={`drill-${drill.id}`}>Your corrected statement</label>
              <input
                id={`drill-${drill.id}`}
                value={answers[drill.id] ?? drill.learnerResult ?? ""}
                disabled={completed}
                onChange={(event) => setAnswers((current) => ({
                  ...current,
                  [drill.id]: event.target.value
                }))}
              />
            </div>
            {!completed ? (
              <button
                type="button"
                className="icon-btn"
                onClick={() => submit(drill.id)}
                disabled={!answers[drill.id]?.trim() || savingId === drill.id}
              >
                <Check size={16} />
                <span>{savingId === drill.id ? "Saving..." : "Submit correction"}</span>
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
