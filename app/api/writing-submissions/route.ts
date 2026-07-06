import { NextResponse } from "next/server";
import { z } from "zod";
import { saveWritingDraft } from "@/src/db/repository";

export const runtime = "nodejs";

const writingSubmissionSchema = z.object({
  lessonId: z.number().int().positive(),
  writingSubmissionId: z.number().int().positive(),
  draft: z.string().trim().min(1)
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = writingSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid writing submission payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const writingSubmission = await saveWritingDraft(parsed.data);
    if (!writingSubmission) {
      return NextResponse.json({ error: "Writing submission not found." }, { status: 404 });
    }
    return NextResponse.json({ writingSubmission });
  } catch (error) {
    console.error("Failed to save writing draft", error);
    return NextResponse.json(
      { error: "Failed to save writing draft." },
      { status: 500 }
    );
  }
}
