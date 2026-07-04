import Link from "next/link";
import type { DatasetExportKind } from "@/src/lib/exports";

const exportsList: Array<{ kind: DatasetExportKind; label: string }> = [
  { kind: "lesson_generation_sft", label: "Lesson generation" },
  { kind: "feedback_scoring_sft", label: "Feedback scoring" },
  { kind: "error_classification", label: "Error classification" },
  { kind: "retry_generation_sft", label: "Retry generation" },
  { kind: "json_repair_sft", label: "JSON repair" }
];

export default function ExportsPage() {
  return (
    <main className="page">
      <div className="section-header">
        <h1>Dataset exports</h1>
      </div>
      <div className="item-grid">
        {exportsList.map((item) => (
          <a
            className="item-card"
            href={`/api/exports/${item.kind}`}
            key={item.kind}
          >
            <strong>{item.label}</strong>
            <span>{item.kind}.jsonl</span>
          </a>
        ))}
      </div>
      <p className="muted">
        <Link href="/">Back to practice</Link>
      </p>
    </main>
  );
}
