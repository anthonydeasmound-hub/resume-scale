import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, queryAll, execute, JobNote } from "@/lib/db";
import { parseIdParam } from "@/lib/params";

// GET /api/jobs/[id]/notes - Get all notes for a job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const jobIdOrError = parseIdParam(id);
  if (jobIdOrError instanceof NextResponse) return jobIdOrError;
  const jobId = jobIdOrError;

  // Verify job belongs to user
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const notes = await queryAll<JobNote>(`
    SELECT * FROM job_notes
    WHERE job_id = $1
    ORDER BY created_at DESC
  `, [jobId]);

  return NextResponse.json(notes);
}

// POST /api/jobs/[id]/notes - Add a note to a job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const jobIdOrError = parseIdParam(id);
  if (jobIdOrError instanceof NextResponse) return jobIdOrError;
  const jobId = jobIdOrError;

  // Verify job belongs to user
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const body = await request.json();
  const { content } = body as { content: string };

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Note content is required" }, { status: 400 });
  }

  const result = await execute(`
    INSERT INTO job_notes (job_id, content)
    VALUES ($1, $2) RETURNING id
  `, [jobId, content.trim()]);

  // Update last_activity_at for the job
  await execute(`
    UPDATE job_applications
    SET last_activity_at = NOW(), updated_at = NOW()
    WHERE id = $1
  `, [jobId]);

  const newNote = await queryOne<JobNote>("SELECT * FROM job_notes WHERE id = $1", [result.rows[0].id]);

  return NextResponse.json(newNote, { status: 201 });
}
