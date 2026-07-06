import { NextResponse } from "next/server";
import { z } from "zod";
import { saveSpeakingAttempt } from "@/src/db/repository";
import { transcribeSpeakingAttempt } from "@/src/lib/speaking-transcription";

export const runtime = "nodejs";

const speakingAttemptSchema = z.object({
  lessonId: z.number().int().positive(),
  promptType: z.string().trim().min(1).max(64),
  promptRef: z.string().trim().min(1).max(1000).nullable().optional(),
  transcript: z.string().trim().min(1).max(10_000)
}).strict();

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = speakingAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid speaking attempt payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const transcription = transcribeSpeakingAttempt({
    provider: "manual",
    transcript: parsed.data.transcript
  });

  try {
    const attempt = await saveSpeakingAttempt({
      lessonPackId: parsed.data.lessonId,
      promptType: parsed.data.promptType,
      promptRef: parsed.data.promptRef ?? null,
      transcript: transcription.transcript,
      sttProvider: transcription.provider,
      sttStatus: transcription.status
    });
    if (!attempt) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        lessonId: attempt.lessonPackId,
        promptType: attempt.promptType,
        promptRef: attempt.promptRef,
        transcript: attempt.transcript,
        sttProvider: attempt.sttProvider,
        sttStatus: attempt.sttStatus,
        createdAt: attempt.createdAt.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to save speaking attempt", error);
    return NextResponse.json(
      { error: "Failed to save speaking attempt." },
      { status: 500 }
    );
  }
}
