import { NextResponse } from "next/server";
import { z } from "zod";
import { saveLessonPackSubmission, listLessonPacks } from "@/src/db/repository";
import {
  parseAiJson,
  sourceModeSchema,
  validateLessonPack
} from "@/src/lib/contracts";

export const runtime = "nodejs";

const lessonPackSubmissionSchema = z.object({
  prompt: z.string().min(1),
  rawAiOutput: z.string().min(1),
  sourceMode: sourceModeSchema.default("manual_free_relay"),
  providerOrSite: z.string().optional().nullable(),
  modelName: z.string().optional().nullable(),
  sessionMinutes: z.number().int().positive().optional()
});

export async function GET() {
  try {
    const lessons = await listLessonPacks();
    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("Failed to list lesson packs", error);
    return NextResponse.json(
      { error: "Failed to list lessons." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const requestParse = lessonPackSubmissionSchema.safeParse(body);
  if (!requestParse.success) {
    return NextResponse.json(
      {
        error: "Invalid lesson-pack submission.",
        issues: requestParse.error.issues
      },
      { status: 400 }
    );
  }

  const submission = requestParse.data;
  try {
    const jsonParse = parseAiJson(submission.rawAiOutput);

  if (!jsonParse.success) {
    const saved = await saveLessonPackSubmission({
      ...submission,
      parsedJson: null,
      validatedJson: null,
      status: "rejected",
      rejectionReason: jsonParse.rejectionReason
    });

    return NextResponse.json(
      {
        ...saved,
        status: "rejected",
        rejectionReason: jsonParse.rejectionReason,
        errors: jsonParse.errors
      },
      { status: 422 }
    );
  }

  const validation = validateLessonPack(jsonParse.data);

  if (!validation.success) {
    const saved = await saveLessonPackSubmission({
      ...submission,
      parsedJson: jsonParse.data,
      validatedJson: null,
      status: "rejected",
      rejectionReason: validation.rejectionReason
    });

    return NextResponse.json(
      {
        ...saved,
        status: "rejected",
        rejectionReason: validation.rejectionReason,
        errors: validation.errors
      },
      { status: 422 }
    );
  }

  const saved = await saveLessonPackSubmission({
    ...submission,
    parsedJson: jsonParse.data,
    validatedJson: validation.data,
    status: "accepted",
    rejectionReason: null
  });

    return NextResponse.json(
      {
        ...saved,
        status: "accepted",
        lessonPack: validation.data
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save lesson pack submission", error);
    return NextResponse.json({ error: "Failed to save lesson." }, { status: 500 });
  }
}
