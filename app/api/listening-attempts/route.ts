import { NextResponse } from "next/server";
import { z } from "zod";
import { saveListeningAttempt } from "@/src/db/repository";

export const runtime = "nodejs";

const listeningAttemptSchema = z.object({
  lessonPackId: z.number().int().positive(),
  gistAnswers: z.array(z.string()),
  detailAnswers: z.array(z.string()),
  keyPhraseAnswers: z.array(z.string()),
  replayCount: z.number().int().min(0),
  scoreGist: z.number().min(0).max(1),
  scoreDetail: z.number().min(0).max(1),
  scoreKeyPhrase: z.number().min(0).max(1),
  missedDetails: z.array(z.string())
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = listeningAttemptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid listening attempt payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const attempt = await saveListeningAttempt(parsed.data);
    if (!attempt) {
      return NextResponse.json(
        { error: "Lesson listening input not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ attempt }, { status: 201 });
  } catch (error) {
    console.error("Failed to save listening attempt", error);
    return NextResponse.json(
      { error: "Failed to save listening attempt." },
      { status: 500 }
    );
  }
}
