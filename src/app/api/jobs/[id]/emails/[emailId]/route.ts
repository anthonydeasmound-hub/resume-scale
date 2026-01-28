import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, execute, EmailAction } from "@/lib/db";
import { parseIdParam } from "@/lib/params";

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
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const email = await queryOne<EmailAction>("SELECT * FROM email_actions WHERE id = $1 AND job_id = $2", [emailIdNum, jobId]);
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
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existingEmail = await queryOne<EmailAction>("SELECT * FROM email_actions WHERE id = $1 AND job_id = $2", [emailIdNum, jobId]);
  if (!existingEmail) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  const body = await request.json();
  const allowedFields = ['subject', 'body', 'recipient_email', 'status', 'sent_at', 'gmail_message_id'];
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

  await execute(`
    UPDATE email_actions
    SET ${updates.join(", ")}
    WHERE id = $${paramIndex++}
  `, [...values, emailIdNum]);

  const updatedEmail = await queryOne<EmailAction>("SELECT * FROM email_actions WHERE id = $1", [emailIdNum]);

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
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existingEmail = await queryOne<{ id: number }>("SELECT * FROM email_actions WHERE id = $1 AND job_id = $2", [emailIdNum, jobId]);
  if (!existingEmail) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  await execute("DELETE FROM email_actions WHERE id = $1", [emailIdNum]);

  return NextResponse.json({ success: true });
}
