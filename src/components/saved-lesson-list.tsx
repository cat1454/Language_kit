import Link from "next/link";
import type { LessonListItem } from "@/src/lib/lesson-data";

export function SavedLessonList({
  lessons,
  loading,
  error
}: {
  lessons: LessonListItem[];
  loading: boolean;
  error: string;
}) {
  return (
    <section className="panel" style={{ marginTop: "28px" }}>
      <h2>Available Practice Lessons</h2>
      {loading ? <p className="status pending">Loading lessons...</p> : null}
      {error ? <p className="status rejected">{error}</p> : null}
      {!loading && !error && lessons.length === 0 ? (
        <p className="muted">No lessons generated yet. Create one above to begin.</p>
      ) : null}
      {!loading && !error && lessons.length > 0 ? (
        <div className="item-grid">
          {lessons.map((lesson) => (
            <Link className="item-card" href={`/lessons/${lesson.id}`} key={lesson.id}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className={`badge level-${lesson.cefrLevel.toLowerCase()}`}>
                    {lesson.cefrLevel}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {new Date(lesson.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <strong>{lesson.topic}</strong>
                <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "6px" }}>
                  {lesson.situation}
                </p>
              </div>
              <div className="card-meta">
                <span style={{ color: "var(--accent-strong)", fontWeight: "600" }}>
                  Practice →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
