import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL ?? null,
    // to avoid dumping secrets, only show whether it's defined
    hasDatabaseUrl: !!process.env.DATABASE_URL,
  });
}
