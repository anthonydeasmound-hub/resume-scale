import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get or create user
  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

  if (!user) {
    const result = db.prepare("INSERT INTO users (email, name, image) VALUES (?, ?, ?)").run(
      session.user.email,
      session.user.name || null,
      session.user.image || null
    );
    user = { id: result.lastInsertRowid as number };
  }

  // Check for existing valid token
  const existingToken = db.prepare(
    "SELECT token FROM extension_tokens WHERE user_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))"
  ).get(user.id) as { token: string } | undefined;

  if (existingToken) {
    return NextResponse.json({ token: existingToken.token });
  }

  // Generate new token
  const token = crypto.randomBytes(32).toString("hex");

  // Store token (expires in 30 days)
  db.prepare(
    "INSERT INTO extension_tokens (user_id, token, expires_at) VALUES (?, ?, datetime('now', '+30 days'))"
  ).run(user.id, token);

  return NextResponse.json({ token });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

  if (user) {
    db.prepare("DELETE FROM extension_tokens WHERE user_id = ?").run(user.id);
  }

  return NextResponse.json({ success: true });
}
