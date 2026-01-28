import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get or create user
  let user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

  if (!user) {
    const result = await execute(
      "INSERT INTO users (email, name, image) VALUES ($1, $2, $3) RETURNING id",
      [session.user.email, session.user.name || null, session.user.image || null]
    );
    user = { id: result.rows[0].id as number };
  }

  // Clean up expired tokens for this user
  await execute("DELETE FROM extension_tokens WHERE user_id = $1 AND expires_at IS NOT NULL AND expires_at <= NOW()", [user.id]);

  // Check for existing valid token
  const existingToken = await queryOne<{ token: string; expires_at: string }>(
    "SELECT token, expires_at FROM extension_tokens WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())",
    [user.id]
  );

  if (existingToken) {
    return NextResponse.json({ token: existingToken.token, expires_at: existingToken.expires_at });
  }

  // Generate new token
  const token = crypto.randomBytes(32).toString("hex");

  // Store token (expires in 30 days)
  await execute(
    "INSERT INTO extension_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 days')",
    [user.id, token]
  );

  return NextResponse.json({ token });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

  if (user) {
    await execute("DELETE FROM extension_tokens WHERE user_id = $1", [user.id]);
  }

  return NextResponse.json({ success: true });
}
