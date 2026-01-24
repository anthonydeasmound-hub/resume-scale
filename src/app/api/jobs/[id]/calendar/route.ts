import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db, { CalendarEvent, CalendarSyncStatus } from "@/lib/db";

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
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare("SELECT id FROM job_applications WHERE id = ? AND user_id = ?").get(jobId, user.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const events = db.prepare(`
    SELECT * FROM calendar_events
    WHERE job_id = ?
    ORDER BY start_time ASC
  `).all(jobId) as CalendarEvent[];

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
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare("SELECT id, company_name, job_title FROM job_applications WHERE id = ? AND user_id = ?").get(jobId, user.id) as { id: number; company_name: string; job_title: string } | undefined;
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

  const result = db.prepare(`
    INSERT INTO calendar_events (job_id, stage_id, google_event_id, title, description, start_time, end_time, location, meeting_link, sync_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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
  );

  const newEvent = db.prepare("SELECT * FROM calendar_events WHERE id = ?").get(result.lastInsertRowid) as CalendarEvent;

  // If there's a linked stage, update its scheduled_at
  if (stage_id) {
    db.prepare(`
      UPDATE interview_stages
      SET scheduled_at = ?, status = 'scheduled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(start_time, stage_id);
  }

  return NextResponse.json(newEvent, { status: 201 });
}
