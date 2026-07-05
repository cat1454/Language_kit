import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/src/db/repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ summary: await getDashboardSummary() });
  } catch (error) {
    console.error("Failed to load dashboard summary", error);
    return NextResponse.json(
      { error: "Failed to load dashboard." },
      { status: 500 }
    );
  }
}
