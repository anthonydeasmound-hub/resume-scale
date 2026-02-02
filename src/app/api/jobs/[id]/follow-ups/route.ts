import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, queryAll, execute } from "@/lib/db";
import { parseIdParam } from "@/lib/params";

export interface JobFollowUp {
  id: number;
  job_id: number;
  contact_id: number | null;
  enabled: boolean;
  email_1_subject: string | null;
  email_1_body: string | null;
  email_1_scheduled: string | null;
  email_1_sent_at: string | null;
  email_2_subject: string | null;
  email_2_body: string | null;
  email_2_scheduled: string | null;
  email_2_sent_at: string | null;
  email_3_subject: string | null;
  email_3_body: string | null;
  email_3_scheduled: string | null;
  email_3_sent_at: string | null;
  auto_archive_date: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

// GET /api/jobs/[id]/follow-ups - Get follow-up settings for a job
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

  const followUp = await queryOne<JobFollowUp>(
    "SELECT * FROM job_follow_ups WHERE job_id = $1",
    [jobId]
  );

  return NextResponse.json(followUp || null);
}

// POST /api/jobs/[id]/follow-ups - Create or update follow-up settings
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

  const job = await queryOne<{ id: number; date_applied: string | null }>(
    "SELECT id, date_applied FROM job_applications WHERE id = $1 AND user_id = $2",
    [jobId, user.id]
  );
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    contact_id,
    enabled,
    email_1_subject,
    email_1_body,
    email_2_subject,
    email_2_body,
    email_3_subject,
    email_3_body,
  } = body;

  // Calculate scheduled dates based on date_applied or today
  const baseDate = job.date_applied ? new Date(job.date_applied) : new Date();
  const email1Date = new Date(baseDate);
  email1Date.setDate(email1Date.getDate() + 7);
  const email2Date = new Date(baseDate);
  email2Date.setDate(email2Date.getDate() + 14);
  const email3Date = new Date(baseDate);
  email3Date.setDate(email3Date.getDate() + 21);
  const archiveDate = new Date(baseDate);
  archiveDate.setDate(archiveDate.getDate() + 28);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  try {
    // Check if follow-up record exists
    const existing = await queryOne<{ id: number }>(
      "SELECT id FROM job_follow_ups WHERE job_id = $1",
      [jobId]
    );

    if (existing) {
      // Update existing record
      await execute(
        `UPDATE job_follow_ups SET
          contact_id = $1,
          enabled = $2,
          email_1_subject = $3,
          email_1_body = $4,
          email_1_scheduled = $5,
          email_2_subject = $6,
          email_2_body = $7,
          email_2_scheduled = $8,
          email_3_subject = $9,
          email_3_body = $10,
          email_3_scheduled = $11,
          auto_archive_date = $12,
          updated_at = NOW()
        WHERE job_id = $13`,
        [
          contact_id || null,
          enabled ?? false,
          email_1_subject || null,
          email_1_body || null,
          formatDate(email1Date),
          email_2_subject || null,
          email_2_body || null,
          formatDate(email2Date),
          email_3_subject || null,
          email_3_body || null,
          formatDate(email3Date),
          formatDate(archiveDate),
          jobId,
        ]
      );
    } else {
      // Create new record
      await execute(
        `INSERT INTO job_follow_ups (
          job_id, contact_id, enabled,
          email_1_subject, email_1_body, email_1_scheduled,
          email_2_subject, email_2_body, email_2_scheduled,
          email_3_subject, email_3_body, email_3_scheduled,
          auto_archive_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          jobId,
          contact_id || null,
          enabled ?? false,
          email_1_subject || null,
          email_1_body || null,
          formatDate(email1Date),
          email_2_subject || null,
          email_2_body || null,
          formatDate(email2Date),
          email_3_subject || null,
          email_3_body || null,
          formatDate(email3Date),
          formatDate(archiveDate),
        ]
      );
    }

    const followUp = await queryOne<JobFollowUp>(
      "SELECT * FROM job_follow_ups WHERE job_id = $1",
      [jobId]
    );

    return NextResponse.json(followUp);
  } catch (error) {
    console.error("Follow-up save error:", error);
    return NextResponse.json({ error: "Failed to save follow-up settings" }, { status: 500 });
  }
}
