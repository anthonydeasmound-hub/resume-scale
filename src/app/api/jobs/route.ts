import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { extractJobInfo, extractJobDetails } from "@/lib/gemini";

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

    // Extract company name, job title, and detailed sections from description using AI
    const [{ company_name, job_title }, jobDetails] = await Promise.all([
      extractJobInfo(job_description),
      extractJobDetails(job_description),
    ]);

    const result = db.prepare(`
      INSERT INTO job_applications (user_id, company_name, job_title, job_description, job_details_parsed, status)
      VALUES (?, ?, ?, ?, ?, 'review')
    `).run(user.id, company_name, job_title, job_description, JSON.stringify(jobDetails));

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

export async function GET(request: NextRequest) {
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
    `).all(user.id) as { id: number }[];

    // Check if we need to include related data
    const url = new URL(request.url);
    const include = url.searchParams.get("include")?.split(",") || [];

    if (include.length > 0) {
      const jobsWithRelations = jobs.map((job) => {
        const result: Record<string, unknown> = { ...job };

        if (include.includes("stages")) {
          const stages = db.prepare(`
            SELECT * FROM interview_stages
            WHERE job_id = ?
            ORDER BY stage_number ASC
          `).all(job.id);
          result.interview_stages = stages;
        }

        if (include.includes("emails")) {
          const emails = db.prepare(`
            SELECT * FROM email_actions
            WHERE job_id = ?
            ORDER BY created_at DESC
          `).all(job.id);
          result.email_actions = emails;
        }

        return result;
      });

      return NextResponse.json(jobsWithRelations);
    }

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
