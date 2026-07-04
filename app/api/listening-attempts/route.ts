import { NextResponse } from "next/server";
import { z } from "zod";
import { saveListeningAttempt } from "@/src/db/repository";

export const runtime = "nodejs";

const listeningAttemptSchema = z.object({
  lessonPackId: z.number().int().positive(),
  listeningInputId: z.number().int().positive(),
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
  const parsed = listeningAttemptSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ issues: parsed.error.issues }, { status: 400 });
  }

  const attempt = await saveListeningAttempt(parsed.data);
  return NextResponse.json({ attempt }, { status: 201 });
}
