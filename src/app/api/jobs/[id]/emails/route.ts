import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, queryAll, execute, EmailAction, EmailType, EmailDirection, EmailStatus } from "@/lib/db";
import { parseIdParam } from "@/lib/params";

// GET /api/jobs/[id]/emails - Get all email actions for a job
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
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const emails = await queryAll<EmailAction>(`
    SELECT * FROM email_actions
    WHERE job_id = $1
    ORDER BY created_at DESC
  `, [jobId]);

  return NextResponse.json(emails);
}

// POST /api/jobs/[id]/emails - Create an email action (draft or record detected email)
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
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number; recruiter_email: string | null }>("SELECT id, recruiter_email FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    stage_id,
    email_type,
    direction,
    subject,
    body: emailBody,
    recipient_email,
    gmail_message_id,
    gmail_thread_id,
    status = 'pending',
    detected_at,
  } = body as {
    stage_id?: number;
    email_type: EmailType;
    direction: EmailDirection;
    subject?: string;
    body?: string;
    recipient_email?: string;
    gmail_message_id?: string;
    gmail_thread_id?: string;
    status?: EmailStatus;
    detected_at?: string;
  };

  if (!email_type || !direction) {
    return NextResponse.json({ error: "email_type and direction are required" }, { status: 400 });
  }

  const result = await execute(`
    INSERT INTO email_actions (job_id, stage_id, email_type, direction, subject, body, recipient_email, gmail_message_id, gmail_thread_id, status, detected_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
  `, [
    jobId,
    stage_id || null,
    email_type,
    direction,
    subject || null,
    emailBody || null,
    recipient_email || job.recruiter_email || null,
    gmail_message_id || null,
    gmail_thread_id || null,
    status,
    detected_at || null
  ]);

  const newEmail = await queryOne<EmailAction>("SELECT * FROM email_actions WHERE id = $1", [result.rows[0].id]);

  return NextResponse.json(newEmail, { status: 201 });
}
