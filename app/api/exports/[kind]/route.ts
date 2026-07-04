import { NextResponse } from "next/server";
import { getDatasetExportRows } from "@/src/db/repository";
import { type DatasetExportKind, formatJsonl } from "@/src/lib/exports";

export const runtime = "nodejs";

const exportKinds: DatasetExportKind[] = [
  "lesson_generation_sft",
  "feedback_scoring_sft",
  "error_classification",
  "retry_generation_sft",
  "json_repair_sft"
];

export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string }> }
) {
  const params = await context.params;

  if (!exportKinds.includes(params.kind as DatasetExportKind)) {
    return NextResponse.json({ error: "Unknown export kind." }, { status: 404 });
  }

  const rows = await getDatasetExportRows(params.kind as DatasetExportKind);
  const body = formatJsonl(rows);

  return new Response(body, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "content-disposition": `attachment; filename="${params.kind}.jsonl"`
    }
  });
}
