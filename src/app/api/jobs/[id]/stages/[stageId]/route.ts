import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, queryAll, execute, InterviewStage, StageStatus } from "@/lib/db";
import { parseIdParam } from "@/lib/params";

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
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const stage = await queryOne<InterviewStage>("SELECT * FROM interview_stages WHERE id = $1 AND job_id = $2", [stageIdNum, jobId]);
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
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existingStage = await queryOne<InterviewStage>("SELECT * FROM interview_stages WHERE id = $1 AND job_id = $2", [stageIdNum, jobId]);
  if (!existingStage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  const body = await request.json();
  const allowedFields = ['stage_type', 'stage_name', 'status', 'scheduled_at', 'completed_at', 'notes'];
  const updates: string[] = [];
  const values: (string | null)[] = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (field in body) {
      updates.push(`${field} = $${paramIndex++}`);
      values.push(body[field] ?? null);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.push("updated_at = NOW()");

  await execute(`
    UPDATE interview_stages
    SET ${updates.join(", ")}
    WHERE id = $${paramIndex++}
  `, [...values, stageIdNum]);

  const updatedStage = await queryOne<InterviewStage>("SELECT * FROM interview_stages WHERE id = $1", [stageIdNum]);

  // If status changed to 'rejected', check if all stages are rejected and update job status
  if (body.status === 'rejected') {
    const allStages = await queryAll<{ status: StageStatus }>("SELECT status FROM interview_stages WHERE job_id = $1", [jobId]);
    const allRejected = allStages.every(s => s.status === 'rejected' || s.status === 'cancelled');
    if (allRejected) {
      await execute(`
        UPDATE job_applications
        SET status = 'rejected', updated_at = NOW()
        WHERE id = $1
      `, [jobId]);
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
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existingStage = await queryOne<{ id: number }>("SELECT * FROM interview_stages WHERE id = $1 AND job_id = $2", [stageIdNum, jobId]);
  if (!existingStage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  await execute("DELETE FROM interview_stages WHERE id = $1", [stageIdNum]);

  // Renumber remaining stages
  const remainingStages = await queryAll<{ id: number }>(`
    SELECT id FROM interview_stages WHERE job_id = $1 ORDER BY stage_number ASC
  `, [jobId]);

  for (let index = 0; index < remainingStages.length; index++) {
    await execute("UPDATE interview_stages SET stage_number = $1 WHERE id = $2", [index + 1, remainingStages[index].id]);
  }

  return NextResponse.json({ success: true });
}
