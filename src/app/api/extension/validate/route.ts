import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    // Validate token
    const tokenRecord = await queryOne<{ id: number; user_id: number; email: string; name: string; expires_at: string }>(
      "SELECT et.id, et.user_id, et.expires_at, u.email, u.name FROM extension_tokens et JOIN users u ON et.user_id = u.id WHERE et.token = $1 AND (et.expires_at IS NULL OR et.expires_at > NOW())",
      [token]
    );

    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Auto-renew token if expiring within 7 days
    if (tokenRecord.expires_at) {
      const expiresAt = new Date(tokenRecord.expires_at);
      const daysUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry < 7) {
        await execute(
          "UPDATE extension_tokens SET expires_at = NOW() + INTERVAL '30 days' WHERE id = $1",
          [tokenRecord.id]
        );
      }
    }

    return NextResponse.json({
      valid: true,
      user: {
        email: tokenRecord.email,
        name: tokenRecord.name,
      },
    });
  } catch (error) {
    console.error("Validate extension token error:", error);
    return NextResponse.json({ error: "Failed to validate token" }, { status: 500 });
  }
}
