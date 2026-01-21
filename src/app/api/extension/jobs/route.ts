import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

function getUserFromToken(request: NextRequest): { id: number; email: string } | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  const tokenRecord = db.prepare(
    "SELECT et.user_id, u.email FROM extension_tokens et JOIN users u ON et.user_id = u.id WHERE et.token = ? AND (et.expires_at IS NULL OR et.expires_at > datetime('now'))"
  ).get(token) as { user_id: number; email: string } | undefined;

  if (!tokenRecord) {
    return null;
  }

  return { id: tokenRecord.user_id, email: tokenRecord.email };
}

export async function POST(request: NextRequest) {
  const user = getUserFromToken(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { job_description, job_title, company_name, company_url, source_url } = body;

    if (!job_description || job_description.length < 50) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }

    // Check for duplicate (same company and title for this user)
    const existing = db.prepare(
      "SELECT id FROM job_applications WHERE user_id = ? AND company_name = ? AND job_title = ?"
    ).get(user.id, company_name || "Unknown Company", job_title || "Unknown Position");

    if (existing) {
      return NextResponse.json({ error: "Job already saved" }, { status: 409 });
    }

    // Create job application
    const result = db.prepare(`
      INSERT INTO job_applications (user_id, company_name, job_title, job_description, status)
      VALUES (?, ?, ?, ?, 'review')
    `).run(
      user.id,
      company_name || "Unknown Company",
      job_title || "Unknown Position",
      job_description
    );

    return NextResponse.json({
      success: true,
      job_id: result.lastInsertRowid,
      message: `${job_title} at ${company_name} saved!`,
    });
  } catch (error) {
    console.error("Extension jobs error:", error);
    return NextResponse.json({ error: "Failed to save job" }, { status: 500 });
  }
}
