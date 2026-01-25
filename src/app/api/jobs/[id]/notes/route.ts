import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db, { JobNote } from "@/lib/db";

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
  const jobId = parseInt(id);

  // Verify job belongs to user
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare("SELECT id FROM job_applications WHERE id = ? AND user_id = ?").get(jobId, user.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const notes = db.prepare(`
    SELECT * FROM job_notes
    WHERE job_id = ?
    ORDER BY created_at DESC
  `).all(jobId) as JobNote[];

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
  const jobId = parseInt(id);

  // Verify job belongs to user
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare("SELECT id FROM job_applications WHERE id = ? AND user_id = ?").get(jobId, user.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const body = await request.json();
  const { content } = body as { content: string };

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Note content is required" }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO job_notes (job_id, content)
    VALUES (?, ?)
  `).run(jobId, content.trim());

  // Update last_activity_at for the job
  db.prepare(`
    UPDATE job_applications
    SET last_activity_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(jobId);

  const newNote = db.prepare("SELECT * FROM job_notes WHERE id = ?").get(result.lastInsertRowid) as JobNote;

  return NextResponse.json(newNote, { status: 201 });
}
