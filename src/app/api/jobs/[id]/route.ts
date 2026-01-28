import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";

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

    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const job = await queryOne(`
      SELECT * FROM job_applications WHERE id = $1 AND user_id = $2
    `, [jobId, user.id]);

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

    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update query dynamically
    const allowedFields = [
      "status", "resume_style", "resume_color", "tailored_resume", "cover_letter",
      "date_applied", "reviewed", "interview_1", "interview_2", "interview_3",
      "interview_4", "interview_5", "recruiter_name", "recruiter_email",
      "recruiter_title", "recruiter_source", "interview_guide", "interview_guide_generated_at"
    ];
    const updateFields: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex++}`);
        // Convert booleans to integers, stringify objects
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

    updateFields.push("updated_at = NOW()");
    values.push(jobId, user.id);

    await execute(`
      UPDATE job_applications
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
    `, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update job error:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}
