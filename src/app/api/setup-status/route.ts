import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json({
        hasResume: false,
        hasExtension: false,
        hasFirstJob: false,
        completedCount: 0,
        totalTasks: 3,
      });
    }

    const resume = db.prepare("SELECT id FROM resumes WHERE user_id = ?").get(user.id) as { id: number } | undefined;
    const hasResume = !!resume;

    const extensionToken = db.prepare(
      "SELECT token FROM extension_tokens WHERE user_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))"
    ).get(user.id) as { token: string } | undefined;
    const hasExtension = !!extensionToken;

    const jobCount = db.prepare(
      "SELECT COUNT(*) as count FROM job_applications WHERE user_id = ?"
    ).get(user.id) as { count: number };
    const hasFirstJob = jobCount.count > 0;

    const completedCount = [hasResume, hasExtension, hasFirstJob].filter(Boolean).length;

    return NextResponse.json({
      hasResume,
      hasExtension,
      hasFirstJob,
      completedCount,
      totalTasks: 3,
    });
  } catch (error) {
    console.error("Setup status error:", error);
    return NextResponse.json({ error: "Failed to fetch setup status" }, { status: 500 });
  }
}
