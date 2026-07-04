import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "language-kit",
    databaseConfigured: Boolean(process.env.DATABASE_URL)
  });
}
