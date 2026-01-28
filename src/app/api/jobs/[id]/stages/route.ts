import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, queryAll, execute, InterviewStage, StageType, StageStatus, StageSource } from "@/lib/db";
import { parseIdParam } from "@/lib/params";

// GET /api/jobs/[id]/stages - Get all stages for a job
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

  const stages = await queryAll<InterviewStage>(`
    SELECT * FROM interview_stages
    WHERE job_id = $1
    ORDER BY stage_number ASC
  `, [jobId]);

  return NextResponse.json(stages);
}

// POST /api/jobs/[id]/stages - Create a new stage
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
  const {
    stage_type,
    stage_name,
    status = 'pending',
    scheduled_at,
    notes,
    source = 'manual',
    source_email_id,
  } = body as {
    stage_type: StageType;
    stage_name?: string;
    status?: StageStatus;
    scheduled_at?: string;
    notes?: string;
    source?: StageSource;
    source_email_id?: string;
  };

  if (!stage_type) {
    return NextResponse.json({ error: "stage_type is required" }, { status: 400 });
  }

  try {
    // Get the next stage number
    const maxStage = await queryOne<{ max_num: number | null }>(`
      SELECT MAX(stage_number) as max_num FROM interview_stages WHERE job_id = $1
    `, [jobId]);
    const stageNumber = (maxStage?.max_num || 0) + 1;

    const result = await execute(`
      INSERT INTO interview_stages (job_id, stage_number, stage_type, stage_name, status, scheduled_at, notes, source, source_email_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `, [
      jobId,
      stageNumber,
      stage_type,
      stage_name || getDefaultStageName(stage_type),
      status,
      scheduled_at || null,
      notes || null,
      source,
      source_email_id || null
    ]);

    const newStage = await queryOne<InterviewStage>("SELECT * FROM interview_stages WHERE id = $1", [result.rows[0].id]);

    // Update job status to 'interview' if it's still 'applied'
    await execute(`
      UPDATE job_applications
      SET status = 'interview', updated_at = NOW()
      WHERE id = $1 AND status = 'applied'
    `, [jobId]);

    return NextResponse.json(newStage, { status: 201 });
  } catch (error) {
    console.error("Create stage error:", error);
    return NextResponse.json({ error: "Failed to create stage" }, { status: 500 });
  }
}

function getDefaultStageName(stageType: StageType): string {
  const names: Record<StageType, string> = {
    phone_screen: 'Phone Screen',
    technical: 'Technical Interview',
    behavioral: 'Behavioral Interview',
    hiring_manager: 'Hiring Manager Interview',
    final: 'Final Round',
    onsite: 'Onsite Interview',
    panel: 'Panel Interview',
    take_home: 'Take Home Assignment',
    other: 'Interview',
  };
  return names[stageType] || 'Interview';
}
