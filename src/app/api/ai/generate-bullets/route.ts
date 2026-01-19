import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { generateBulletOptions } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jobId, role } = await request.json();

    if (!role || !role.company || !role.title || !role.description) {
      return NextResponse.json({ error: "Role information is required" }, { status: 400 });
    }

    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get job application
    const job = db.prepare(`
      SELECT * FROM job_applications WHERE id = ? AND user_id = ?
    `).get(jobId, user.id) as {
      job_description: string;
      job_title: string;
      company_name: string;
    } | undefined;

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Generate 8 bullet options for the role
    const bullets = await generateBulletOptions(
      role,
      job.job_description,
      job.job_title,
      job.company_name
    );

    return NextResponse.json({ bullets });
  } catch (error) {
    console.error("Generate bullets error:", error);
    return NextResponse.json({ error: "Failed to generate bullets" }, { status: 500 });
  }
}
