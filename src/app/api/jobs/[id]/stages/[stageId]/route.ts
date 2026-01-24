import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db, { InterviewStage, StageStatus } from "@/lib/db";

// GET /api/jobs/[id]/stages/[stageId] - Get a specific stage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, stageId } = await params;
  const jobId = parseInt(id);
  const stageIdNum = parseInt(stageId);

  // Verify job belongs to user
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare("SELECT id FROM job_applications WHERE id = ? AND user_id = ?").get(jobId, user.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const stage = db.prepare("SELECT * FROM interview_stages WHERE id = ? AND job_id = ?").get(stageIdNum, jobId) as InterviewStage | undefined;
  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  return NextResponse.json(stage);
}

// PATCH /api/jobs/[id]/stages/[stageId] - Update a stage
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, stageId } = await params;
  const jobId = parseInt(id);
  const stageIdNum = parseInt(stageId);

  // Verify job belongs to user
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare("SELECT id FROM job_applications WHERE id = ? AND user_id = ?").get(jobId, user.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existingStage = db.prepare("SELECT * FROM interview_stages WHERE id = ? AND job_id = ?").get(stageIdNum, jobId) as InterviewStage | undefined;
  if (!existingStage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  const body = await request.json();
  const allowedFields = ['stage_type', 'stage_name', 'status', 'scheduled_at', 'completed_at', 'notes'];
  const updates: string[] = [];
  const values: (string | null)[] = [];

  for (const field of allowedFields) {
    if (field in body) {
      updates.push(`${field} = ?`);
      values.push(body[field] ?? null);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(stageIdNum.toString());

  db.prepare(`
    UPDATE interview_stages
    SET ${updates.join(", ")}
    WHERE id = ?
  `).run(...values.slice(0, -1), stageIdNum);

  const updatedStage = db.prepare("SELECT * FROM interview_stages WHERE id = ?").get(stageIdNum) as InterviewStage;

  // If status changed to 'rejected', check if all stages are rejected and update job status
  if (body.status === 'rejected') {
    const allStages = db.prepare("SELECT status FROM interview_stages WHERE job_id = ?").all(jobId) as { status: StageStatus }[];
    const allRejected = allStages.every(s => s.status === 'rejected' || s.status === 'cancelled');
    if (allRejected) {
      db.prepare(`
        UPDATE job_applications
        SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(jobId);
    }
  }

  return NextResponse.json(updatedStage);
}

// DELETE /api/jobs/[id]/stages/[stageId] - Delete a stage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, stageId } = await params;
  const jobId = parseInt(id);
  const stageIdNum = parseInt(stageId);

  // Verify job belongs to user
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare("SELECT id FROM job_applications WHERE id = ? AND user_id = ?").get(jobId, user.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existingStage = db.prepare("SELECT * FROM interview_stages WHERE id = ? AND job_id = ?").get(stageIdNum, jobId);
  if (!existingStage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM interview_stages WHERE id = ?").run(stageIdNum);

  // Renumber remaining stages
  const remainingStages = db.prepare(`
    SELECT id FROM interview_stages WHERE job_id = ? ORDER BY stage_number ASC
  `).all(jobId) as { id: number }[];

  remainingStages.forEach((stage, index) => {
    db.prepare("UPDATE interview_stages SET stage_number = ? WHERE id = ?").run(index + 1, stage.id);
  });

  return NextResponse.json({ success: true });
}
