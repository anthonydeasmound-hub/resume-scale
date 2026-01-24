import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db, { CalendarEvent } from "@/lib/db";

// GET /api/jobs/[id]/calendar/[eventId] - Get a specific calendar event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, eventId } = await params;
  const jobId = parseInt(id);
  const eventIdNum = parseInt(eventId);

  // Verify job belongs to user
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare("SELECT id FROM job_applications WHERE id = ? AND user_id = ?").get(jobId, user.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const event = db.prepare("SELECT * FROM calendar_events WHERE id = ? AND job_id = ?").get(eventIdNum, jobId) as CalendarEvent | undefined;
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

// PATCH /api/jobs/[id]/calendar/[eventId] - Update a calendar event
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, eventId } = await params;
  const jobId = parseInt(id);
  const eventIdNum = parseInt(eventId);

  // Verify job belongs to user
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare("SELECT id FROM job_applications WHERE id = ? AND user_id = ?").get(jobId, user.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existingEvent = db.prepare("SELECT * FROM calendar_events WHERE id = ? AND job_id = ?").get(eventIdNum, jobId) as CalendarEvent | undefined;
  if (!existingEvent) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await request.json();
  const allowedFields = ['title', 'description', 'start_time', 'end_time', 'location', 'meeting_link', 'google_event_id', 'sync_status', 'stage_id'];
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

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
  values.push(eventIdNum);

  db.prepare(`
    UPDATE calendar_events
    SET ${updates.join(", ")}
    WHERE id = ?
  `).run(...values);

  const updatedEvent = db.prepare("SELECT * FROM calendar_events WHERE id = ?").get(eventIdNum) as CalendarEvent;

  // If start_time changed and there's a linked stage, update the stage's scheduled_at
  if (body.start_time && updatedEvent.stage_id) {
    db.prepare(`
      UPDATE interview_stages
      SET scheduled_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(body.start_time, updatedEvent.stage_id);
  }

  return NextResponse.json(updatedEvent);
}

// DELETE /api/jobs/[id]/calendar/[eventId] - Delete a calendar event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, eventId } = await params;
  const jobId = parseInt(id);
  const eventIdNum = parseInt(eventId);

  // Verify job belongs to user
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare("SELECT id FROM job_applications WHERE id = ? AND user_id = ?").get(jobId, user.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existingEvent = db.prepare("SELECT * FROM calendar_events WHERE id = ? AND job_id = ?").get(eventIdNum, jobId) as CalendarEvent | undefined;
  if (!existingEvent) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM calendar_events WHERE id = ?").run(eventIdNum);

  // If there was a linked stage, clear its scheduled_at
  if (existingEvent.stage_id) {
    db.prepare(`
      UPDATE interview_stages
      SET scheduled_at = NULL, status = 'pending', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'scheduled'
    `).run(existingEvent.stage_id);
  }

  return NextResponse.json({ success: true });
}
