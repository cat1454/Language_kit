import { NextResponse } from "next/server";
import { getLessonPackDetail } from "@/src/db/repository";
import { normalizeListeningAudioMetadata } from "@/src/lib/listening-audio-metadata";

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
        listeningInput: {
          id: result.listeningInput.id,
          audioPath: result.listeningInput.audioPath ?? null,
          audioMetadata: normalizeListeningAudioMetadata(
            result.listeningInput.audioMetadataJson
          )
        },
        listeningAttempts: result.listeningAttempts.map((attempt) => ({
          id: attempt.id,
          lessonPackId: attempt.lessonPackId,
          listeningInputId: attempt.listeningInputId,
          gistAnswers: attempt.gistAnswers,
          detailAnswers: attempt.detailAnswers,
          keyPhraseAnswers: attempt.keyPhraseAnswers,
          replayCount: attempt.replayCount,
          scoreGist: attempt.scoreGist,
          scoreDetail: attempt.scoreDetail,
          scoreKeyPhrase: attempt.scoreKeyPhrase,
          missedDetails: attempt.missedDetails,
          createdAt: attempt.createdAt.toISOString()
        })),
        roleplayTurns: result.roleplayTurns.map((turn) => ({
          id: turn.id,
          lessonPackId: turn.lessonPackId,
          turnIndex: turn.turnIndex,
          aiPrompt: turn.aiPrompt,
          learnerGoal: turn.learnerGoal,
          learnerResponse: turn.learnerResponse
        })),
        writingSubmission: result.writingSubmission ? {
          id: result.writingSubmission.id,
          lessonPackId: result.writingSubmission.lessonPackId,
          task: result.writingSubmission.task,
          constraints: result.writingSubmission.constraintsJson,
          targetChunks: result.writingSubmission.targetChunksJson,
          draft: result.writingSubmission.draft
        } : null,
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
