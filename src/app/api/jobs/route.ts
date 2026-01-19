import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { extractJobInfo } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { job_description } = await request.json();

    if (!job_description) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract company name and job title from description using AI
    const { company_name, job_title } = await extractJobInfo(job_description);

    const result = db.prepare(`
      INSERT INTO job_applications (user_id, company_name, job_title, job_description, status)
      VALUES (?, ?, ?, ?, 'review')
    `).run(user.id, company_name, job_title, job_description);

    return NextResponse.json({
      success: true,
      job_id: result.lastInsertRowid,
      company_name,
      job_title
    });
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json({ error: "Failed to create job application" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json([]);
    }

    const jobs = db.prepare(`
      SELECT * FROM job_applications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(user.id);

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
