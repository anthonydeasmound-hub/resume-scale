import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, execute, JobNote } from "@/lib/db";
import { parseIdParam } from "@/lib/params";

// PATCH /api/jobs/[id]/notes/[noteId] - Update a note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, noteId } = await params;
  const jobIdOrError = parseIdParam(id);
  if (jobIdOrError instanceof NextResponse) return jobIdOrError;
  const jobId = jobIdOrError;

  const noteIdOrError = parseIdParam(noteId);
  if (noteIdOrError instanceof NextResponse) return noteIdOrError;
  const noteIdNum = noteIdOrError;

  // Verify job belongs to user
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Verify note belongs to this job
  const existingNote = await queryOne<JobNote>("SELECT * FROM job_notes WHERE id = $1 AND job_id = $2", [noteIdNum, jobId]);
  if (!existingNote) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const body = await request.json();
  const { content } = body as { content: string };

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Note content is required" }, { status: 400 });
  }

  try {
    await execute(`
      UPDATE job_notes
      SET content = $1, updated_at = NOW()
      WHERE id = $2
    `, [content.trim(), noteIdNum]);

    const updated = await queryOne<JobNote>("SELECT * FROM job_notes WHERE id = $1", [noteIdNum]);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update note error:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

// DELETE /api/jobs/[id]/notes/[noteId] - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, noteId } = await params;
  const jobIdOrError = parseIdParam(id);
  if (jobIdOrError instanceof NextResponse) return jobIdOrError;
  const jobId = jobIdOrError;

  const noteIdOrError = parseIdParam(noteId);
  if (noteIdOrError instanceof NextResponse) return noteIdOrError;
  const noteIdNum = noteIdOrError;

  // Verify job belongs to user
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Verify note belongs to this job
  const existingNote = await queryOne<JobNote>("SELECT * FROM job_notes WHERE id = $1 AND job_id = $2", [noteIdNum, jobId]);
  if (!existingNote) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  try {
    await execute("DELETE FROM job_notes WHERE id = $1", [noteIdNum]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete note error:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
