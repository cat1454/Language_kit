import { NextResponse } from "next/server";
import { z } from "zod";
import { getReviewQueue } from "@/src/db/repository";

export const runtime = "nodejs";

const positiveIntQuery = z
  .string()
  .regex(/^\d+$/)
  .transform((value) => Number(value))
  .pipe(z.number().int().positive());

const reviewQueueQuerySchema = z
  .object({
    lessonId: positiveIntQuery.optional(),
    limit: positiveIntQuery.pipe(z.number().max(25)).optional()
  })
  .transform(({ lessonId, limit }) => ({
    ...(lessonId === undefined ? {} : { lessonId }),
    limit: limit ?? 10
  }));

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!hasOnlySupportedQueryParams(url.searchParams)) {
    return NextResponse.json(
      { error: "Invalid review queue query." },
      { status: 400 }
    );
  }
  const parsed = reviewQueueQuerySchema.safeParse({
    lessonId: valueOrUndefined(url.searchParams.get("lessonId")),
    limit: valueOrUndefined(url.searchParams.get("limit"))
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid review queue query.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await getReviewQueue(parsed.data));
  } catch (error) {
    console.error("Failed to load review queue", error);
    return NextResponse.json(
      { error: "Failed to load review queue." },
      { status: 500 }
    );
  }
}

function valueOrUndefined(value: string | null): string | undefined {
  return value === null ? undefined : value;
}

function hasOnlySupportedQueryParams(params: URLSearchParams): boolean {
  const allowed = new Set(["lessonId", "limit"]);
  return [...params.keys()].every(
    (key) => allowed.has(key) && params.getAll(key).length === 1
  );
}
