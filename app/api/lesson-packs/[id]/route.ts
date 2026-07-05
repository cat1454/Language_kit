import { NextResponse } from "next/server";
import { getLessonPackDetail } from "@/src/db/repository";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid lesson id." }, { status: 400 });
  }

  try {
    const result = await getLessonPackDetail(id);
    if (!result || !result.listeningInput) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    return NextResponse.json({
      detail: {
        lessonPack: {
          id: result.lessonPack.id,
          status: result.lessonPack.status,
          prompt: result.lessonPack.prompt,
          rawAiOutput: result.lessonPack.rawAiOutput,
          validatedJson: result.lessonPack.validatedJson,
          createdAt: result.lessonPack.createdAt.toISOString()
        },
        lesson: result.lesson,
        listeningInputId: result.listeningInput.id,
        listeningAttempts: result.listeningAttempts.map((attempt) => ({
          ...attempt,
          createdAt: attempt.createdAt.toISOString()
        })),
        retryDrills: result.retryDrills.map((drill) => ({
          id: drill.id,
          lessonPackId: drill.lessonPackId,
          instruction: drill.instruction,
          items: drill.itemsJson,
          learnerResult: drill.learnerResult,
          completedAt: drill.completedAt?.toISOString() ?? null
        }))
      }
    });
  } catch (error) {
    console.error("Failed to load lesson detail", error);
    return NextResponse.json(
      { error: "Failed to load lesson." },
      { status: 500 }
    );
  }
}
