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
  const parsed = completeSchema.safeParse(await request.json());

  if (!Number.isInteger(id) || id <= 0 || !parsed.success) {
    return NextResponse.json({ error: "Invalid retry drill completion." }, { status: 400 });
  }

  const drill = await completeRetryDrill(id, parsed.data.learnerResult);
  return NextResponse.json({ drill });
}
