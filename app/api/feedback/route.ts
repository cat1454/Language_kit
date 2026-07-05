import { NextResponse } from "next/server";
import { z } from "zod";
import { saveFeedback } from "@/src/db/repository";
import {
  parseAiJson,
  sourceModeSchema,
  validateFeedback
} from "@/src/lib/contracts";

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
    return NextResponse.json({ issues: requestParse.error.issues }, { status: 400 });
  }

  const jsonParse = parseAiJson(requestParse.data.rawAiOutput);
  if (!jsonParse.success) {
    return NextResponse.json(
      {
        status: "rejected",
        rejectionReason: jsonParse.rejectionReason,
        errors: jsonParse.errors
      },
      { status: 422 }
    );
  }

  const feedbackParse = validateFeedback(jsonParse.data);
  if (!feedbackParse.success) {
    return NextResponse.json(
      {
        status: "rejected",
        rejectionReason: feedbackParse.rejectionReason,
        errors: feedbackParse.errors
      },
      { status: 422 }
    );
  }

  try {
    const saved = await saveFeedback({
      ...requestParse.data,
      feedback: feedbackParse.data
    });

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
