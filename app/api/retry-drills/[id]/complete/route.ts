import { NextResponse } from "next/server";
import { z } from "zod";
import { completeRetryDrill } from "@/src/db/repository";

export const runtime = "nodejs";

const completeSchema = z.object({
  learnerResult: z.string().min(1)
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = Number(params.id);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const parsed = completeSchema.safeParse(body);

  if (!Number.isInteger(id) || id <= 0 || !parsed.success) {
    return NextResponse.json({ error: "Invalid retry drill completion." }, { status: 400 });
  }

  try {
    const drill = await completeRetryDrill(id, parsed.data.learnerResult);
    if (!drill) {
      return NextResponse.json({ error: "Retry drill not found." }, { status: 404 });
    }
    return NextResponse.json({ drill });
  } catch (error) {
    console.error("Failed to complete retry drill", error);
    return NextResponse.json(
      { error: "Failed to complete retry drill." },
      { status: 500 }
    );
  }
}
