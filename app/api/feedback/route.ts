import { NextResponse } from "next/server";
import { z } from "zod";
import { saveFeedback, saveRejectedFeedbackOutput } from "@/src/db/repository";
import {
  type RejectionReason,
  sourceModeSchema,
  validateFeedback
} from "@/src/lib/contracts";
import { parseManualFeedbackJson } from "@/src/lib/manual-feedback-json";

export const runtime = "nodejs";

const feedbackSubmissionSchema = z.object({
  lessonPackId: z.number().int().positive(),
  prompt: z.string().min(1),
  rawAiOutput: z.string().min(1),
  sourceMode: sourceModeSchema.default("manual_free_relay"),
  providerOrSite: z.string().optional().nullable(),
  modelName: z.string().optional().nullable()
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const requestParse = feedbackSubmissionSchema.safeParse(body);

  if (!requestParse.success) {
    return NextResponse.json(
      { error: "Invalid feedback submission payload.", issues: requestParse.error.issues },
      { status: 400 }
    );
  }

  const jsonParse = parseManualFeedbackJson(requestParse.data.rawAiOutput);
  if (!jsonParse.success) {
    return rejectAndPersistFeedback({
      input: requestParse.data,
      parsedJson: null,
      rejectionReason: jsonParse.rejectionReason,
      errors: jsonParse.errors
    });
  }

  const feedbackParse = validateFeedback(jsonParse.data);
  if (!feedbackParse.success) {
    return rejectAndPersistFeedback({
      input: requestParse.data,
      parsedJson: jsonParse.data,
      rejectionReason: feedbackParse.rejectionReason,
      errors: feedbackParse.errors
    });
  }

  try {
    const saved = await saveFeedback({
      ...requestParse.data,
      feedback: feedbackParse.data
    });

    if (!saved) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    return NextResponse.json(
      { status: "accepted", feedback: feedbackParse.data, ...saved },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save feedback", error);
    return NextResponse.json(
      { error: "Failed to save feedback." },
      { status: 500 }
    );
  }
}

async function rejectAndPersistFeedback(input: {
  input: z.infer<typeof feedbackSubmissionSchema>;
  parsedJson: unknown | null;
  rejectionReason: RejectionReason;
  errors: string[];
}) {
  try {
    const saved = await saveRejectedFeedbackOutput({
      ...input.input,
      parsedJson: input.parsedJson,
      rejectionReason: input.rejectionReason
    });

    if (!saved) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        status: "rejected",
        rejectionReason: input.rejectionReason,
        errors: input.errors
      },
      { status: 422 }
    );
  } catch (error) {
    console.error("Failed to save rejected feedback", error);
    return NextResponse.json(
      { error: "Failed to save feedback." },
      { status: 500 }
    );
  }
}
