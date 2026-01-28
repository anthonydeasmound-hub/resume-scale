import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({
        hasResume: false,
        hasExtension: false,
        hasFirstJob: false,
        completedCount: 0,
        totalTasks: 3,
      });
    }

    const resume = await queryOne<{ id: number }>("SELECT id FROM resumes WHERE user_id = $1", [user.id]);
    const hasResume = !!resume;

    const extensionToken = await queryOne<{ token: string }>(
      "SELECT token FROM extension_tokens WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())",
      [user.id]
    );
    const hasExtension = !!extensionToken;

    const jobCount = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM job_applications WHERE user_id = $1",
      [user.id]
    );
    const hasFirstJob = jobCount!.count > 0;

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
