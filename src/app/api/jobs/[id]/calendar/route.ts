import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, queryAll, execute, CalendarEvent, CalendarSyncStatus } from "@/lib/db";

// GET /api/jobs/[id]/calendar - Get all calendar events for a job
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

  const events = await queryAll<CalendarEvent>(`
    SELECT * FROM calendar_events
    WHERE job_id = $1
    ORDER BY start_time ASC
  `, [jobId]);

  return NextResponse.json(events);
}

// POST /api/jobs/[id]/calendar - Create a calendar event (local, will sync later)
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

  const job = await queryOne<{ id: number; company_name: string; job_title: string }>("SELECT id, company_name, job_title FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    stage_id,
    title,
    description,
    start_time,
    end_time,
    location,
    meeting_link,
    google_event_id,
    sync_status = 'local',
  } = body as {
    stage_id?: number;
    title?: string;
    description?: string;
    start_time: string;
    end_time: string;
    location?: string;
    meeting_link?: string;
    google_event_id?: string;
    sync_status?: CalendarSyncStatus;
  };

  if (!start_time || !end_time) {
    return NextResponse.json({ error: "start_time and end_time are required" }, { status: 400 });
  }

  // Generate default title if not provided
  const eventTitle = title || `Interview - ${job.company_name} (${job.job_title})`;

  const result = await execute(`
    INSERT INTO calendar_events (job_id, stage_id, google_event_id, title, description, start_time, end_time, location, meeting_link, sync_status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
  `, [
    jobId,
    stage_id || null,
    google_event_id || null,
    eventTitle,
    description || null,
    start_time,
    end_time,
    location || null,
    meeting_link || null,
    sync_status
  ]);

  const newEvent = await queryOne<CalendarEvent>("SELECT * FROM calendar_events WHERE id = $1", [result.rows[0].id]);

  // If there's a linked stage, update its scheduled_at
  if (stage_id) {
    await execute(`
      UPDATE interview_stages
      SET scheduled_at = $1, status = 'scheduled', updated_at = NOW()
      WHERE id = $2
    `, [start_time, stage_id]);
  }

  return NextResponse.json(newEvent, { status: 201 });
}
