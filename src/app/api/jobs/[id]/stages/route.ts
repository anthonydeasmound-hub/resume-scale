import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db, { InterviewStage, StageType, StageStatus, StageSource } from "@/lib/db";

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

  const stages = db.prepare(`
    SELECT * FROM interview_stages
    WHERE job_id = ?
    ORDER BY stage_number ASC
  `).all(jobId) as InterviewStage[];

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

  // Get the next stage number
  const maxStage = db.prepare(`
    SELECT MAX(stage_number) as max_num FROM interview_stages WHERE job_id = ?
  `).get(jobId) as { max_num: number | null };
  const stageNumber = (maxStage?.max_num || 0) + 1;

  const result = db.prepare(`
    INSERT INTO interview_stages (job_id, stage_number, stage_type, stage_name, status, scheduled_at, notes, source, source_email_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    jobId,
    stageNumber,
    stage_type,
    stage_name || getDefaultStageName(stage_type),
    status,
    scheduled_at || null,
    notes || null,
    source,
    source_email_id || null
  );

  const newStage = db.prepare("SELECT * FROM interview_stages WHERE id = ?").get(result.lastInsertRowid) as InterviewStage;

  // Update job status to 'interview' if it's still 'applied'
  db.prepare(`
    UPDATE job_applications
    SET status = 'interview', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'applied'
  `).run(jobId);

  return NextResponse.json(newStage, { status: 201 });
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
