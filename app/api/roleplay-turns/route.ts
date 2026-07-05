import { NextResponse } from "next/server";
import { z } from "zod";
import { saveRoleplayTurnResponse } from "@/src/db/repository";

export const runtime = "nodejs";

const roleplayTurnSchema = z.object({
  lessonId: z.number().int().positive(),
  turnId: z.number().int().positive(),
  learnerResponse: z.string().trim().min(1)
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = roleplayTurnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid roleplay turn payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const roleplayTurn = await saveRoleplayTurnResponse(parsed.data);
    if (!roleplayTurn) {
      return NextResponse.json({ error: "Roleplay turn not found." }, { status: 404 });
    }
    return NextResponse.json({ roleplayTurn });
  } catch (error) {
    console.error("Failed to save roleplay response", error);
    return NextResponse.json(
      { error: "Failed to save roleplay response." },
      { status: 500 }
    );
  }
}
