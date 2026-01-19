import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const jobId = parseInt(id);

    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const job = db.prepare(`
      SELECT * FROM job_applications WHERE id = ? AND user_id = ?
    `).get(jobId, user.id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Get job error:", error);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const jobId = parseInt(id);
    const updates = await request.json();

    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update query dynamically
    const allowedFields = ["status", "resume_style", "resume_color", "tailored_resume", "cover_letter", "date_applied", "reviewed", "interview_1", "interview_2", "interview_3", "interview_4", "interview_5"];
    const updateFields: string[] = [];
    const values: (string | number)[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        // Convert booleans to integers for SQLite, stringify objects
        let dbValue: string | number | null;
        if (typeof value === "boolean") {
          dbValue = value ? 1 : 0;
        } else if (typeof value === "object" && value !== null) {
          dbValue = JSON.stringify(value);
        } else {
          dbValue = value as string | number | null;
        }
        values.push(dbValue as string | number);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(jobId, user.id);

    db.prepare(`
      UPDATE job_applications
      SET ${updateFields.join(", ")}
      WHERE id = ? AND user_id = ?
    `).run(...values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update job error:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}
