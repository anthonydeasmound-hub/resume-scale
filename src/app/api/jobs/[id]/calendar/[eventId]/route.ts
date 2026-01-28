import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, execute, CalendarEvent } from "@/lib/db";
import { parseIdParam } from "@/lib/params";

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
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const event = await queryOne<CalendarEvent>("SELECT * FROM calendar_events WHERE id = $1 AND job_id = $2", [eventIdNum, jobId]);
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
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existingEvent = await queryOne<CalendarEvent>("SELECT * FROM calendar_events WHERE id = $1 AND job_id = $2", [eventIdNum, jobId]);
  if (!existingEvent) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await request.json();
  const allowedFields = ['title', 'description', 'start_time', 'end_time', 'location', 'meeting_link', 'google_event_id', 'sync_status', 'stage_id'];
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
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

  try {
    updates.push("updated_at = NOW()");

    await execute(`
      UPDATE calendar_events
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex++}
    `, [...values, eventIdNum]);

    const updatedEvent = await queryOne<CalendarEvent>("SELECT * FROM calendar_events WHERE id = $1", [eventIdNum]);

    // If start_time changed and there's a linked stage, update the stage's scheduled_at
    if (body.start_time && updatedEvent?.stage_id) {
      await execute(`
        UPDATE interview_stages
        SET scheduled_at = $1, updated_at = NOW()
        WHERE id = $2
      `, [body.start_time, updatedEvent.stage_id]);
    }

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Update calendar event error:", error);
    return NextResponse.json({ error: "Failed to update calendar event" }, { status: 500 });
  }
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
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existingEvent = await queryOne<CalendarEvent>("SELECT * FROM calendar_events WHERE id = $1 AND job_id = $2", [eventIdNum, jobId]);
  if (!existingEvent) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    await execute("DELETE FROM calendar_events WHERE id = $1", [eventIdNum]);

    // If there was a linked stage, clear its scheduled_at
    if (existingEvent.stage_id) {
      await execute(`
        UPDATE interview_stages
        SET scheduled_at = NULL, status = 'pending', updated_at = NOW()
        WHERE id = $1 AND status = 'scheduled'
      `, [existingEvent.stage_id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete calendar event error:", error);
    return NextResponse.json({ error: "Failed to delete calendar event" }, { status: 500 });
  }
}
