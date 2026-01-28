import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const token = authHeader.substring(7);

  // Validate token
  const tokenRecord = await queryOne<{ user_id: number; email: string; name: string }>(
    "SELECT et.*, u.email, u.name FROM extension_tokens et JOIN users u ON et.user_id = u.id WHERE et.token = $1 AND (et.expires_at IS NULL OR et.expires_at > NOW())",
    [token]
  );

  if (!tokenRecord) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  return NextResponse.json({
    valid: true,
    user: {
      email: tokenRecord.email,
      name: tokenRecord.name,
    },
  });
}
