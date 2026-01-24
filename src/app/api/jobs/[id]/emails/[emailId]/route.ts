import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db, { EmailAction } from "@/lib/db";

// GET /api/jobs/[id]/emails/[emailId] - Get a specific email action
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, emailId } = await params;
  const jobId = parseInt(id);
  const emailIdNum = parseInt(emailId);

  // Verify job belongs to user
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare("SELECT id FROM job_applications WHERE id = ? AND user_id = ?").get(jobId, user.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const email = db.prepare("SELECT * FROM email_actions WHERE id = ? AND job_id = ?").get(emailIdNum, jobId) as EmailAction | undefined;
  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  return NextResponse.json(email);
}

// PATCH /api/jobs/[id]/emails/[emailId] - Update an email action (edit draft, mark as sent)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, emailId } = await params;
  const jobId = parseInt(id);
  const emailIdNum = parseInt(emailId);

  // Verify job belongs to user
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare("SELECT id FROM job_applications WHERE id = ? AND user_id = ?").get(jobId, user.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existingEmail = db.prepare("SELECT * FROM email_actions WHERE id = ? AND job_id = ?").get(emailIdNum, jobId) as EmailAction | undefined;
  if (!existingEmail) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  const body = await request.json();
  const allowedFields = ['subject', 'body', 'recipient_email', 'status', 'sent_at', 'gmail_message_id'];
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

  values.push(emailIdNum.toString());

  db.prepare(`
    UPDATE email_actions
    SET ${updates.join(", ")}
    WHERE id = ?
  `).run(...values.slice(0, -1), emailIdNum);

  const updatedEmail = db.prepare("SELECT * FROM email_actions WHERE id = ?").get(emailIdNum) as EmailAction;

  return NextResponse.json(updatedEmail);
}

// DELETE /api/jobs/[id]/emails/[emailId] - Delete an email action
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, emailId } = await params;
  const jobId = parseInt(id);
  const emailIdNum = parseInt(emailId);

  // Verify job belongs to user
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare("SELECT id FROM job_applications WHERE id = ? AND user_id = ?").get(jobId, user.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existingEmail = db.prepare("SELECT * FROM email_actions WHERE id = ? AND job_id = ?").get(emailIdNum, jobId);
  if (!existingEmail) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM email_actions WHERE id = ?").run(emailIdNum);

  return NextResponse.json({ success: true });
}
