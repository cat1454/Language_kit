"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type {
  ReviewActionType,
  ReviewItem,
  ReviewQueueSummary,
  ReviewPriority
} from "@/src/lib/adaptive-review";

export function ReviewNextPanel({
  items,
  summary,
  loading,
  error
}: {
  items: ReviewItem[];
  summary: ReviewQueueSummary;
  loading: boolean;
  error: string;
}) {
  return (
    <div className="panel" data-testid="review-next-panel">
      <h2>Review next</h2>
      {loading ? <p className="status pending">Loading review queue...</p> : null}
      {error ? <p className="status rejected" role="alert">{error}</p> : null}
      {!loading && !error && items.length === 0 ? (
        <p className="muted" style={{ padding: "20px 0" }}>
          No review items yet. Complete a lesson, feedback, or retry drill to build your queue.
        </p>
      ) : null}
      {!loading && !error && items.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <p className="muted">
            {summary.total} total | {summary.urgent} urgent | {summary.high} high
          </p>
          {items.map((item) => (
            <article
              key={item.id}
              style={{
                borderTop: "1px solid var(--line)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                paddingTop: "14px"
              }}
            >
              <div style={{ alignItems: "center", display: "flex", gap: "10px" }}>
                <span className={priorityClass(item.priority)}>
                  {priorityLabel(item.priority)}
                </span>
                <span className="muted">{item.lessonTitle}</span>
              </div>
              <Link href={`/lessons/${item.lessonId}`} style={{ fontWeight: 800 }}>
                {item.title}
              </Link>
              <p>{item.reason}</p>
              {item.evidenceSnippet ? (
                <p className="muted">Evidence: {item.evidenceSnippet}</p>
              ) : null}
              <Link href={`/lessons/${item.lessonId}`} className="button secondary">
                <ArrowRight size={16} />
                <span>{actionHint(item.actionType)}</span>
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function priorityLabel(priority: ReviewPriority): string {
  return {
    4: "Urgent",
    3: "High",
    2: "Normal",
    1: "Low"
  }[priority];
}

function priorityClass(priority: ReviewPriority): string {
  return priority >= 3 ? "badge level-c1" : "badge level-b1";
}

function actionHint(actionType: ReviewActionType): string {
  return {
    retry_drill: "Open retry",
    review_error: "Review error",
    redo_listening: "Redo listening",
    revise_writing: "Revise writing",
    practice_roleplay: "Practice roleplay",
    practice_speaking: "Practice speaking"
  }[actionType];
}
